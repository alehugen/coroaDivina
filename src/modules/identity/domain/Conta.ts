import { podeSerOrga, type Grau } from './Grau'

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
  /** Recebe e-mail de lembrete na véspera */
  receberLembretes: boolean
  /** Pediu exclusão da conta (aguardando admin) */
  exclusaoSolicitadaEm: string | null
  grau: Grau
}

export const isAprovado = (c: Conta | null): c is Conta => c?.status === 'aprovado'
export const isAdmin = (c: Conta | null) => isAprovado(c) && c.role === 'admin'
/** Admin, ou Orgã vigente com grau CDC/QM: pode gerenciar escalas (espelha is_gestor() no banco) */
export const isGestor = (c: Conta | null) =>
  isAprovado(c) && (c.role === 'admin' || (c.isOrga && podeSerOrga(c.grau)))
export const isQM = (c: Conta | null) => isAprovado(c) && c.grau === 'QM'
/** Admin ou QM: edita a agenda e define o grau dos sócios */
export const podeEditarAgenda = (c: Conta | null) => isAdmin(c) || isQM(c)
export const podeDefinirGrau = podeEditarAgenda

export function primeiroNome(c: Conta | null): string {
  return c?.nome.trim().split(/\s+/)[0] ?? ''
}
