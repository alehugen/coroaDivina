import { fail, ok, type Result } from '@/shared/lib/result'

/** Telefone brasileiro armazenado só com dígitos (DDD + número). */
export type Telefone = string & { readonly __brand: 'Telefone' }

export function criarTelefone(valor: string): Result<Telefone> {
  let digitos = valor.replace(/\D/g, '')
  if (digitos.startsWith('55') && digitos.length > 11) digitos = digitos.slice(2)
  if (!digitos) return fail('Informe o telefone.')
  if (digitos.length < 10 || digitos.length > 11) return fail('Telefone inválido. Use DDD + número.')
  return ok(digitos as Telefone)
}

/** (11) 98765-4321 */
export function formatarTelefone(digitos: string): string {
  const d = digitos.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}
