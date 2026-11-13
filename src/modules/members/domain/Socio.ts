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
}

/** Agrupamento usado nas abas do painel. Rejeitados entram em "inativos". */
export type GrupoStatus = 'pendente' | 'aprovado' | 'inativo'

export const grupoDe = (s: Pick<Socio, 'status'>): GrupoStatus =>
  s.status === 'pendente' ? 'pendente' : s.status === 'aprovado' ? 'aprovado' : 'inativo'

export function contarPorGrupo(socios: Socio[]): Record<GrupoStatus, number> {
  const c = { pendente: 0, aprovado: 0, inativo: 0 }
  for (const s of socios) c[grupoDe(s)]++
  return c
}

export function filtrarSocios(socios: Socio[], grupo: GrupoStatus, busca = ''): Socio[] {
  const q = normalizar(busca)
  const digitos = busca.replace(/\D/g, '')
  return socios
    .filter((s) => grupoDe(s) === grupo)
    .filter(
      (s) =>
        !q ||
        normalizar(s.nome).includes(q) ||
        s.email.includes(q) ||
        (digitos.length >= 3 && s.telefone.includes(digitos)),
    )
    .sort((a, b) =>
      // pendentes: mais antigos primeiro (fila de aprovação); demais: alfabético
      grupo === 'pendente' ? a.criadoEm.localeCompare(b.criadoEm) : a.nome.localeCompare(b.nome, 'pt-BR'),
    )
}

export interface AcoesSocio {
  aprovar: boolean
  rejeitar: boolean
  desativar: boolean
  reativar: boolean
  tornarAdmin: boolean
  removerAdmin: boolean
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
  }
}

export function linkWhatsApp(telefone: string): string | null {
  const d = telefone.replace(/\D/g, '')
  return d.length >= 10 ? `https://wa.me/55${d}` : null
}
