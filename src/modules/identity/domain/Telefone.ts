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

/**
 * Máscara progressiva para digitação: "4" → "(4", "4198" → "(41) 98",
 * "4198817" → "(41) 9881-7", "41988177093" → "(41) 98817-7093".
 * Aceita colar "+55 41 ..." (remove o DDI).
 */
export function mascararTelefone(valor: string): string {
  let d = valor.replace(/\D/g, '')
  if (d.startsWith('55') && d.length > 11) d = d.slice(2)
  d = d.slice(0, 11)

  if (!d) return ''
  if (d.length <= 2) return `(${d}`
  const ddd = `(${d.slice(0, 2)}) `
  const resto = d.slice(2)
  if (resto.length <= 4) return ddd + resto
  // 8 dígitos (fixo) → 4-4; 9 dígitos (celular) → 5-4
  const corte = resto.length === 9 ? 5 : 4
  return `${ddd}${resto.slice(0, corte)}-${resto.slice(corte)}`
}
