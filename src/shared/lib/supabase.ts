import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local')
}

/** Cliente único do Supabase. Use apenas na camada de infrastructure. */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/**
 * Executa um insert/update/delete com `.select('id')` e exige que alguma linha tenha sido afetada:
 * o RLS bloqueia em silêncio (0 linhas), e aqui isso vira o erro SEM_PERMISSAO.
 */
export async function exigir<T>(p: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<void> {
  const { data, error } = await p
  if (error) throw error
  if (!data?.length) throw new Error('SEM_PERMISSAO')
}
