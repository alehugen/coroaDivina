import { exigir, supabase } from '@/shared/lib/supabase'
import type { MembersRepository } from '../application/ports/MembersRepository'
import type { Mandato } from '../domain/Mandato'
import type { Socio } from '../domain/Socio'

interface ProfileRow {
  id: string
  nome: string
  email: string
  telefone: string
  role: Socio['role']
  status: Socio['status']
  created_at: string
  aprovado_em: string | null
  exclusao_solicitada_em: string | null
  grau: Socio['grau']
}

interface MandatoRow {
  id: string
  profile_id: string
  inicio: string
  fim: string
  profiles: { nome: string } | null
}

export const supabaseMembersRepository: MembersRepository = {
  async listarSocios() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, role, status, created_at, aprovado_em, exclusao_solicitada_em, grau')
      .order('nome')
      .returns<ProfileRow[]>()
    if (error) throw error
    return data.map((r) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      telefone: r.telefone,
      role: r.role,
      status: r.status,
      criadoEm: r.created_at,
      aprovadoEm: r.aprovado_em,
      exclusaoSolicitadaEm: r.exclusao_solicitada_em,
      grau: r.grau,
    }))
  },

  async alterarStatus(id, status) {
    await exigir(supabase.from('profiles').update({ status }).eq('id', id).select('id'))
  },

  async alterarRole(id, role) {
    await exigir(supabase.from('profiles').update({ role }).eq('id', id).select('id'))
  },

  async definirGrau(id, grau) {
    const { error } = await supabase.rpc('definir_grau', { p_profile_id: id, p_grau: grau })
    if (error) throw error
  },

  async excluirConta(id) {
    const { error } = await supabase.functions.invoke('excluir-conta', { body: { profileId: id } })
    if (error) {
      // Erros HTTP da função trazem { error: 'CODIGO' } no corpo
      let mensagem = error.message
      try {
        const corpo = await (error as { context?: Response }).context?.json()
        if (corpo?.error) mensagem = corpo.error
      } catch {
        /* corpo não é JSON */
      }
      throw new Error(mensagem)
    }
  },

  async recusarExclusao(id) {
    const { error } = await supabase.rpc('cancelar_solicitacao_exclusao', { p_profile_id: id })
    if (error) throw error
  },

  async listarMandatos() {
    const { data, error } = await supabase
      .from('orga_mandatos')
      .select('id, profile_id, inicio, fim, profiles(nome)')
      .order('inicio', { ascending: false })
      .returns<MandatoRow[]>()
    if (error) throw error
    return data.map(
      (r): Mandato => ({
        id: r.id,
        profileId: r.profile_id,
        nome: r.profiles?.nome ?? '—',
        inicio: r.inicio,
        fim: r.fim,
      }),
    )
  },

  async criarMandato({ profileId, inicio, fim }) {
    const { error } = await supabase
      .from('orga_mandatos')
      .insert({ profile_id: profileId, inicio, fim })
    if (error) throw error
  },

  async alterarFimMandato(id, fim) {
    await exigir(supabase.from('orga_mandatos').update({ fim }).eq('id', id).select('id'))
  },

  async removerMandato(id) {
    await exigir(supabase.from('orga_mandatos').delete().eq('id', id).select('id'))
  },
}
