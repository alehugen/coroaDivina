import { exigir, supabase } from '@/shared/lib/supabase'
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
    await exigir(supabase.from('eventos').insert(d).select('id'))
  },

  async atualizar(id, d) {
    await exigir(supabase.from('eventos').update(d).eq('id', id).select('id'))
  },

  async remover(id) {
    await exigir(supabase.from('eventos').delete().eq('id', id).select('id'))
  },
}
