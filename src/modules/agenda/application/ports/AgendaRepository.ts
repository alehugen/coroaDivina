import type { DataISO } from '@/shared/lib/datas'
import type { DadosEvento, Evento } from '../../domain/Evento'

export interface AgendaRepository {
  /** Eventos entre as datas (inclusive). */
  listar(de: DataISO, ate: DataISO): Promise<Evento[]>
  criar(dados: DadosEvento): Promise<void>
  atualizar(id: string, dados: DadosEvento): Promise<void>
  remover(id: string): Promise<void>
}
