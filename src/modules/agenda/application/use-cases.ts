import { tentar } from '@/shared/lib/errors'
import type { DataISO } from '@/shared/lib/datas'
import { validarEvento, type DadosEvento } from '../domain/Evento'
import type { AgendaRepository } from './ports/AgendaRepository'

export function criarUseCasesAgenda(repo: AgendaRepository) {
  return {
    listar: (de: DataISO, ate: DataISO) => tentar(() => repo.listar(de, ate)),

    /** Cria (sem id) ou atualiza. */
    async salvar(dados: DadosEvento, id?: string) {
      const v = validarEvento(dados)
      if (!v.ok) return v
      return tentar(() => (id ? repo.atualizar(id, v.value) : repo.criar(v.value)))
    },

    remover: (id: string) => tentar(() => repo.remover(id)),
  }
}
