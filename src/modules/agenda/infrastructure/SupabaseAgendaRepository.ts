import { supabase } from '@/shared/lib/supabase'
import type { AgendaRepository } from '../application/ports/AgendaRepository'
import type { Evento } from '../domain/Evento'

interface EventoRow {
  id: string
  data: string
  hora: string | null
  titulo: string
  detalhe: string
  cor: Evento['cor']
}

/** RLS bloqueia em silêncio: confere que a linha foi realmente afetada. */
function exigirLinha<T>(data: T[] | null) {
  if (!data?.length) throw new Error('SEM_PERMISSAO')
}

export const supabaseAgendaRepository: AgendaRepository = {
  async listar(de, ate) {
    const { data, error } = await supabase
      .from('eventos')
      .select('id, data, hora, titulo, detalhe, cor')
      .gte('data', de)
      .lte('data', ate)
      .order('data')
      .returns<EventoRow[]>()
    if (error) throw error
    // Postgres devolve 'HH:mm:ss'
    return data.map((r) => ({ ...r, hora: r.hora ? r.hora.slice(0, 5) : null }))
  },

  async criar(d) {
    const { data, error } = await supabase.from('eventos').insert(d).select('id')
    if (error) throw error
    exigirLinha(data)
  },

  async atualizar(id, d) {
    const { data, error } = await supabase.from('eventos').update(d).eq('id', id).select('id')
    if (error) throw error
    exigirLinha(data)
  },

  async remover(id) {
    const { data, error } = await supabase.from('eventos').delete().eq('id', id).select('id')
    if (error) throw error
    exigirLinha(data)
  },
}
