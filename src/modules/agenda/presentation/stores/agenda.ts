import { defineStore } from 'pinia'
import { ref } from 'vue'
import { hojeISO, somarMeses, type DataISO } from '@/shared/lib/datas'
import { agenda } from '../..'
import type { Evento } from '../../domain/Evento'

/**
 * Eventos de uma janela larga (6 meses para trás, 12 para frente):
 * navegar entre meses e imprimir não exige nova consulta.
 */
export const useAgendaStore = defineStore('agenda', () => {
  const eventos = ref<Evento[]>([])
  const carregando = ref(false)
  const carregado = ref(false)
  const erro = ref('')
  let janela: { de: DataISO; ate: DataISO } | null = null

  async function carregar(referencia: DataISO = hojeISO()) {
    const base = `${referencia.slice(0, 7)}-01`
    janela = { de: somarMeses(base, -6), ate: somarMeses(base, 13) }
    carregando.value = true
    erro.value = ''
    const r = await agenda.listar(janela.de, janela.ate)
    carregando.value = false
    carregado.value = true
    if (r.ok) eventos.value = r.value
    else erro.value = r.error
  }

  /** Garante que o mês esteja dentro da janela carregada. */
  async function garantirMes(ano: number, mes: number) {
    const inicio = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
    if (!janela || inicio < janela.de || inicio >= janela.ate) await carregar(inicio)
  }

  const recarregar = () => carregar(janela ? somarMeses(janela.de, 6) : hojeISO())

  return { eventos, carregando, carregado, erro, carregar, garantirMes, recarregar }
})
