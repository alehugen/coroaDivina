import { criarUseCasesIdentidade } from './application/use-cases'
import { supabaseAuthRepository } from './infrastructure/SupabaseAuthRepository'

/** Composition root do módulo: liga os use cases à implementação Supabase. */
export const authRepository = supabaseAuthRepository
export const identidade = criarUseCasesIdentidade(authRepository)

export * from './domain/Conta'
export * from './domain/Grau'
export { default as GrauBadge } from './presentation/components/GrauBadge.vue'
export { formatarTelefone } from './domain/Telefone'
export { useSessionStore } from './presentation/stores/session'
