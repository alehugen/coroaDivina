import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { toast } from '@/shared/composables/useToast'
import type { Result } from '@/shared/lib/result'
import type { MandatoRef, PatchFuncaoDia } from '../../application/ports/EscalasRepository'
import { criarUseCasesEscalas } from '../../application/use-cases'
import { descreverOrgas, type EscalaDetalhada } from '../../domain/Escala'
import { supabaseEscalasRepository } from '../../infrastructure/SupabaseEscalasRepository'

const escalas = criarUseCasesEscalas(supabaseEscalasRepository)

/** Estado da escala aberta no editor (admin/Orgã). */
export const useEscalaEditorStore = defineStore('escalaEditor', () => {
  const escala = ref<EscalaDetalhada | null>(null)
  const mandatos = ref<MandatoRef[]>([])
  const carregando = ref(false)
  const naoEncontrada = ref(false)
  const erro = ref('')

  const orgas = computed(() =>
    escala.value ? descreverOrgas(mandatos.value, escala.value.dataInicio, escala.value.dataFim) : '',
  )
  const totalInscricoes = computed(
    () => escala.value?.dias.reduce((n, d) => n + d.funcoes.reduce((m, f) => m + f.inscricoes.length, 0), 0) ?? 0,
  )

  async function carregar(id: string) {
    if (escala.value?.id !== id) escala.value = null
    carregando.value = true
    naoEncontrada.value = false
    const [r, m] = await Promise.all([escalas.obter(id), escalas.listarOrgas()])
    carregando.value = false
    if (m.ok) mandatos.value = m.value
    if (!r.ok) {
      erro.value = r.error
      return
    }
    erro.value = ''
    escala.value = r.value
    naoEncontrada.value = !r.value
  }

  const recarregar = () => (escala.value ? carregar(escala.value.id) : Promise.resolve())

  /** Executa uma ação; em caso de erro mostra toast. Sempre recarrega a escala. */
  async function executar<T>(acao: () => Promise<Result<T>>, sucesso?: string): Promise<boolean> {
    const r = await acao()
    if (!r.ok) toast(r.error, 'danger')
    else if (sucesso) toast(sucesso)
    await recarregar()
    return r.ok
  }

  /** Atualização otimista de uma função do dia (vagas/ativa), com rollback via recarga em erro. */
  async function atualizarFuncao(funcaoId: string, patch: PatchFuncaoDia) {
    const f = escala.value?.dias.flatMap((d) => d.funcoes).find((x) => x.id === funcaoId)
    if (f) Object.assign(f, patch)
    const r = await escalas.atualizarFuncao(funcaoId, patch)
    if (!r.ok) {
      toast(r.error, 'danger')
      await recarregar()
    }
  }

  return {
    escala,
    mandatos,
    carregando,
    naoEncontrada,
    erro,
    orgas,
    totalInscricoes,
    carregar,
    recarregar,
    executar,
    atualizarFuncao,
  }
})
