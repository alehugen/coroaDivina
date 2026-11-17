import { defineStore } from 'pinia'
import { ref } from 'vue'
import { hojeISO, somarMeses, type DataISO } from '@/shared/lib/datas'
import { agenda } from '../..'
import type { Evento } from '../../domain/Evento'

/**
 * Eventos de uma janela larga em torno do mês pedido (6 meses para trás, 12 para frente):
 * navegar entre meses e imprimir não exige nova consulta.
 */
export const useAgendaStore = defineStore('agenda', () => {
  const eventos = ref<Evento[]>([])
  const carregando = ref(false)
  const carregado = ref(false)
  const erro = ref('')
  let janela: { de: DataISO; ate: DataISO } | null = null
  // Só a resposta do pedido mais recente vale (navegação rápida entre meses distantes)
  let pedido = 0

  async function carregar(referencia: DataISO = hojeISO()) {
    const meu = ++pedido
    const base = `${referencia.slice(0, 7)}-01`
    const nova = { de: somarMeses(base, -6), ate: somarMeses(base, 13) }
    carregando.value = true
    const r = await agenda.listar(nova.de, nova.ate)
    if (meu !== pedido) return
    carregando.value = false
    carregado.value = true
    erro.value = r.ok ? '' : r.error
    if (r.ok) {
      eventos.value = r.value
      janela = nova // a janela só muda junto com os eventos dela
    }
  }

  /** Garante que o mês esteja dentro da janela carregada. */
  async function garantirMes(chave: string) {
    const inicio = `${chave}-01`
    if (!janela || inicio < janela.de || inicio >= janela.ate) await carregar(inicio)
  }

  const recarregar = () => carregar(janela ? somarMeses(janela.de, 6) : hojeISO())

  return { eventos, carregando, carregado, erro, carregar, garantirMes, recarregar }
})
