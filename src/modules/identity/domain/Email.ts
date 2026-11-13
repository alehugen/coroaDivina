import { fail, ok, type Result } from '@/shared/lib/result'

const REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type Email = string & { readonly __brand: 'Email' }

export function criarEmail(valor: string): Result<Email> {
  const v = valor.trim().toLowerCase()
  if (!v) return fail('Informe o e-mail.')
  if (!REGEX.test(v)) return fail('E-mail inválido.')
  return ok(v as Email)
}
