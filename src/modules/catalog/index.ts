import { criarUseCasesCatalogo } from './application/use-cases'
import { supabaseCatalogRepository } from './infrastructure/SupabaseCatalogRepository'

/** Composition root do catálogo (áreas e funções modelo). */
export const catalogo = criarUseCasesCatalogo(supabaseCatalogRepository)

export * from './domain/Catalogo'
export { useCatalogStore } from './presentation/stores/catalog'
