import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isAdmin, isAprovado, isGestor, podeDefinirGrau, podeEditarAgenda, type Conta } from '../../domain/Conta'
import { authRepository as repo } from '../..'

export const useSessionStore = defineStore('session', () => {
  const conta = ref<Conta | null>(null)
  const carregado = ref(false)
  let inicializacao: Promise<void> | null = null

  const logado = computed(() => conta.value !== null)
  const aprovado = computed(() => isAprovado(conta.value))
  const admin = computed(() => isAdmin(conta.value))
  const gestor = computed(() => isGestor(conta.value))
  const editaAgenda = computed(() => podeEditarAgenda(conta.value))
  const defineGrau = computed(() => podeDefinirGrau(conta.value))
  /** Vê a área de Administração (escalas, ou ao menos os sócios para definir grau) */
  const painel = computed(() => gestor.value || defineGrau.value)

  /**
   * Recarrega a conta. `null` = sem sessão ou conta inexistente (ex.: excluída).
   * Em falha de rede mantém o que já havia, para não "deslogar" por um soluço de conexão.
   */
  async function recarregar() {
    try {
      conta.value = await repo.contaAtual()
    } catch {
      /* mantém a conta atual */
    }
  }

  /** Idempotente: carrega a sessão uma vez e passa a escutar mudanças. */
  function init(): Promise<void> {
    if (!inicializacao) {
      inicializacao = recarregar().finally(() => (carregado.value = true))
      repo.aoMudarSessao((evento) => {
        if (evento === 'INITIAL_SESSION' || evento === 'TOKEN_REFRESHED') return
        // Não chamar o Supabase dentro do callback (pode travar o lock de auth).
        setTimeout(recarregar, 0)
      })
    }
    return inicializacao
  }

  /**
   * Sai e recarrega o app no login: zera de uma vez todas as stores (sócios, agenda, escalas...),
   * para que outra pessoa entrando no mesmo aparelho não veja dados da anterior.
   */
  async function sair({ recarregar = true } = {}) {
    await repo.sair()
    conta.value = null
    if (recarregar) window.location.replace('/entrar')
  }

  return { conta, carregado, logado, aprovado, admin, gestor, editaAgenda, defineGrau, painel, init, recarregar, sair }
})
