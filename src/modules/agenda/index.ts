import { criarUseCasesAgenda } from './application/use-cases'
import { supabaseAgendaRepository } from './infrastructure/SupabaseAgendaRepository'

/** Composition root da agenda do núcleo. */
export const agenda = criarUseCasesAgenda(supabaseAgendaRepository)

export * from './domain/Evento'
