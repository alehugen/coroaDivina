export type Role = 'admin' | 'socio'
export type StatusCadastro = 'pendente' | 'aprovado' | 'rejeitado' | 'inativo'

/** Conta do usuário logado, com as permissões calculadas no banco. */
export interface Conta {
  id: string
  nome: string
  email: string
  telefone: string
  role: Role
  status: StatusCadastro
  /** Tem mandato de Orgã vigente hoje */
  isOrga: boolean
}

export const isAprovado = (c: Conta | null): c is Conta => c?.status === 'aprovado'
export const isAdmin = (c: Conta | null) => isAprovado(c) && c.role === 'admin'
/** Admin ou Orgã vigente: pode gerenciar escalas */
export const isGestor = (c: Conta | null) => isAprovado(c) && (c.role === 'admin' || c.isOrga)

export function primeiroNome(c: Conta | null): string {
  return c?.nome.trim().split(/\s+/)[0] ?? ''
}
