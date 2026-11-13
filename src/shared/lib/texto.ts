/** Minúsculas e sem acentos — para buscas ("joao" encontra "João"). */
export const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

/** "Maria da Silva" -> "MS" */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => p.length > 2 || p === p.toUpperCase())
  const [a, b] = [partes[0] ?? nome, partes.length > 1 ? partes[partes.length - 1]! : '']
  return (a.charAt(0) + b.charAt(0)).toUpperCase()
}
