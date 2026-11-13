import { criarUseCasesEscalas } from './application/use-cases'
import { supabaseEscalasRepository } from './infrastructure/SupabaseEscalasRepository'

/** Composition root do módulo de escalas. */
export const escalas = criarUseCasesEscalas(supabaseEscalasRepository)

export * from './domain/Escala'
export * from './domain/Inscricao'
export * from './domain/Calendario'
export * from './domain/Exportacao'
