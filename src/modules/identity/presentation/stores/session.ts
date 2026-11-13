import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isAdmin, isAprovado, isGestor, type Conta } from '../../domain/Conta'
import { supabaseAuthRepository as repo } from '../../infrastructure/SupabaseAuthRepository'

export const useSessionStore = defineStore('session', () => {
  const conta = ref<Conta | null>(null)
  const carregado = ref(false)
  let inicializacao: Promise<void> | null = null

  const logado = computed(() => conta.value !== null)
  const aprovado = computed(() => isAprovado(conta.value))
  const admin = computed(() => isAdmin(conta.value))
  const gestor = computed(() => isGestor(conta.value))

  async function recarregar() {
    try {
      conta.value = await repo.contaAtual()
    } catch {
      conta.value = null
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

  async function sair() {
    await repo.sair()
    conta.value = null
  }

  return { conta, carregado, logado, aprovado, admin, gestor, init, recarregar, sair }
})
