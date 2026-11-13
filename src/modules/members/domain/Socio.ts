import type { Role, StatusCadastro } from '@/modules/identity/domain/Conta'
import { normalizar } from '@/shared/lib/texto'

export interface Socio {
  id: string
  nome: string
  email: string
  telefone: string
  role: Role
  status: StatusCadastro
  criadoEm: string
  aprovadoEm: string | null
  /** Pediu exclusão permanente (aguardando decisão do admin). */
  exclusaoSolicitadaEm: string | null
}

/**
 * Abas do painel. Rejeitados entram em "inativos".
 * "exclusao" é transversal: quem pediu exclusão, em qualquer status.
 */
export type GrupoStatus = 'pendente' | 'aprovado' | 'inativo' | 'exclusao'

export const grupoDe = (s: Pick<Socio, 'status'>): Exclude<GrupoStatus, 'exclusao'> =>
  s.status === 'pendente' ? 'pendente' : s.status === 'aprovado' ? 'aprovado' : 'inativo'

export function contarPorGrupo(socios: Socio[]): Record<GrupoStatus, number> {
  const c = { pendente: 0, aprovado: 0, inativo: 0, exclusao: 0 }
  for (const s of socios) {
    c[grupoDe(s)]++
    if (s.exclusaoSolicitadaEm) c.exclusao++
  }
  return c
}

const pertence = (s: Socio, grupo: GrupoStatus) =>
  grupo === 'exclusao' ? !!s.exclusaoSolicitadaEm : grupoDe(s) === grupo

export function filtrarSocios(socios: Socio[], grupo: GrupoStatus, busca = ''): Socio[] {
  const q = normalizar(busca)
  const digitos = busca.replace(/\D/g, '')
  return socios
    .filter((s) => pertence(s, grupo))
    .filter(
      (s) =>
        !q ||
        normalizar(s.nome).includes(q) ||
        s.email.includes(q) ||
        (digitos.length >= 3 && s.telefone.includes(digitos)),
    )
    .sort((a, b) => {
      // filas (pendentes / pedidos de exclusão): mais antigos primeiro; demais: alfabético
      if (grupo === 'pendente') return a.criadoEm.localeCompare(b.criadoEm)
      if (grupo === 'exclusao') return a.exclusaoSolicitadaEm!.localeCompare(b.exclusaoSolicitadaEm!)
      return a.nome.localeCompare(b.nome, 'pt-BR')
    })
}

export interface AcoesSocio {
  aprovar: boolean
  rejeitar: boolean
  desativar: boolean
  reativar: boolean
  tornarAdmin: boolean
  removerAdmin: boolean
  /** Exclusão permanente (apaga conta e inscrições). */
  excluir: boolean
  recusarExclusao: boolean
}

/** Quais ações o admin logado pode executar sobre um sócio (ninguém altera a si mesmo). */
export function acoesPermitidas(s: Socio, meuId: string): AcoesSocio {
  const euMesmo = s.id === meuId
  return {
    aprovar: s.status === 'pendente',
    rejeitar: s.status === 'pendente',
    desativar: s.status === 'aprovado' && !euMesmo,
    reativar: s.status === 'inativo' || s.status === 'rejeitado',
    tornarAdmin: s.status === 'aprovado' && s.role !== 'admin',
    removerAdmin: s.status === 'aprovado' && s.role === 'admin' && !euMesmo,
    // Admin precisa perder o papel de admin antes (evita excluir admins por engano)
    excluir: !euMesmo && s.role !== 'admin',
    recusarExclusao: !!s.exclusaoSolicitadaEm,
  }
}

export function linkWhatsApp(telefone: string): string | null {
  const d = telefone.replace(/\D/g, '')
  return d.length >= 10 ? `https://wa.me/55${d}` : null
}
