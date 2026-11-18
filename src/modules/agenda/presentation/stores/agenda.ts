import { defineStore } from 'pinia'
import { ref } from 'vue'
import { hojeISO, somarMeses, type DataISO } from '@/shared/lib/datas'
import { agenda } from '../..'
import type { Evento } from '../../domain/Evento'

interface Janela {
  de: DataISO
  ate: DataISO
}

/** Janela larga em torno do intervalo (6 meses antes, 12 depois), sempre contendo o intervalo inteiro. */
function janelaPara(de: DataISO, ate: DataISO): Janela {
  const base = `${de.slice(0, 7)}-01`
  const padrao = somarMeses(base, 13)
  const minimo = somarMeses(`${ate.slice(0, 7)}-01`, 1)
  return { de: somarMeses(base, -6), ate: padrao > minimo ? padrao : minimo }
}

/** Eventos já carregados: navegar entre períodos próximos não exige nova consulta. */
export const useAgendaStore = defineStore('agenda', () => {
  const eventos = ref<Evento[]>([])
  const carregando = ref(false)
  const carregado = ref(false)
  const erro = ref('')
  const janela = ref<Janela | null>(null)
  // Só a resposta do pedido mais recente vale (navegação rápida entre períodos distantes)
  let pedido = 0

  async function buscar(nova: Janela) {
    const meu = ++pedido
    carregando.value = true
    const r = await agenda.listar(nova.de, nova.ate)
    if (meu !== pedido) return
    carregando.value = false
    carregado.value = true
    erro.value = r.ok ? '' : r.error
    if (r.ok) {
      eventos.value = r.value
      janela.value = nova // a janela só muda junto com os eventos dela
    }
  }

  /** Os eventos desse intervalo já estão todos em memória? */
  const cobre = (de: DataISO, ate: DataISO) =>
    !!janela.value && de >= janela.value.de && ate <= janela.value.ate

  /** Carrega o intervalo se faltar; com `forcar`, busca de novo (ao abrir a tela, para vir atualizado). */
  async function garantirIntervalo(de: DataISO, ate: DataISO, { forcar = false } = {}) {
    if (cobre(de, ate)) {
      if (forcar) await buscar(janela.value!)
      return
    }
    await buscar(janelaPara(de, ate))
  }

  function recarregar() {
    const hoje = hojeISO()
    return buscar(janela.value ?? janelaPara(hoje, hoje))
  }

  return { eventos, carregando, carregado, erro, cobre, garantirIntervalo, recarregar }
})
