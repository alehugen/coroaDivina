import { supabase } from '@/shared/lib/supabase'
import type { AuthRepository } from '../application/ports/AuthRepository'
import type { Conta } from '../domain/Conta'

interface ContaRow {
  id: string
  nome: string
  email: string
  telefone: string
  role: Conta['role']
  status: Conta['status']
  is_orga: boolean
}

const toConta = (r: ContaRow): Conta => ({
  id: r.id,
  nome: r.nome,
  email: r.email,
  telefone: r.telefone,
  role: r.role,
  status: r.status,
  isOrga: r.is_orga,
})

export const supabaseAuthRepository: AuthRepository = {
  async cadastrar({ nome, email, telefone, senha }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, telefone },
        emailRedirectTo: `${window.location.origin}/entrar`,
      },
    })
    if (error) throw error
    // Com confirmação de e-mail ativa, o Supabase devolve um user sem identities
    // quando o e-mail já existe (proteção contra enumeração).
    if (data.user && data.user.identities?.length === 0) throw new Error('User already registered')
    return { precisaConfirmarEmail: !data.session }
  },

  async entrar(email, senha) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
  },

  async sair() {
    await supabase.auth.signOut()
  },

  async contaAtual() {
    const { data: s } = await supabase.auth.getSession()
    if (!s.session) return null
    const { data, error } = await supabase.rpc('minha_conta').maybeSingle<ContaRow>()
    if (error) throw error
    return data ? toConta(data) : null
  },

  async solicitarRedefinicaoSenha(email, redirectTo) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  },

  async redefinirSenha(novaSenha) {
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) throw error
  },

  async atualizarPerfil(id, { nome, telefone }) {
    const { data, error } = await supabase.from('profiles').update({ nome, telefone }).eq('id', id).select('id')
    if (error) throw error
    if (!data?.length) throw new Error('SEM_PERMISSAO')
    // Mantém o metadata do Auth coerente (nome aparece em e-mails/painel do Supabase)
    await supabase.auth.updateUser({ data: { nome, telefone } })
  },

  aoMudarSessao(cb) {
    const { data } = supabase.auth.onAuthStateChange((evento) => cb(evento))
    return () => data.subscription.unsubscribe()
  },
}
