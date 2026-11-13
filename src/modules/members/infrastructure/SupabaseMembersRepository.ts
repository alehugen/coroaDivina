import { supabase } from '@/shared/lib/supabase'
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
}

interface MandatoRow {
  id: string
  profile_id: string
  inicio: string
  fim: string
  profiles: { nome: string } | null
}

/** Garante que a operação realmente afetou uma linha (RLS bloqueia em silêncio). */
function exigirLinha<T>(data: T[] | null) {
  if (!data?.length) throw new Error('SEM_PERMISSAO')
}

export const supabaseMembersRepository: MembersRepository = {
  async listarSocios() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, role, status, created_at, aprovado_em')
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
    }))
  },

  async alterarStatus(id, status) {
    const { data, error } = await supabase.from('profiles').update({ status }).eq('id', id).select('id')
    if (error) throw error
    exigirLinha(data)
  },

  async alterarRole(id, role) {
    const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select('id')
    if (error) throw error
    exigirLinha(data)
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
    const { data, error } = await supabase.from('orga_mandatos').update({ fim }).eq('id', id).select('id')
    if (error) throw error
    exigirLinha(data)
  },

  async removerMandato(id) {
    const { data, error } = await supabase.from('orga_mandatos').delete().eq('id', id).select('id')
    if (error) throw error
    exigirLinha(data)
  },
}
