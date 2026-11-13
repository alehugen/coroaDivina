import { criarUseCasesMembros } from './application/use-cases'
import { supabaseMembersRepository } from './infrastructure/SupabaseMembersRepository'

/** Composition root do módulo de sócios. */
export const membros = criarUseCasesMembros(supabaseMembersRepository)

export * from './domain/Mandato'
export * from './domain/Socio'
export { useMembersStore } from './presentation/stores/members'
