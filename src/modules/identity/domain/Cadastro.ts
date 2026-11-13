import { fail, ok, type Result } from '@/shared/lib/result'
import { criarEmail, type Email } from './Email'
import { criarTelefone, type Telefone } from './Telefone'

export interface DadosCadastro {
  nome: string
  email: string
  telefone: string
  senha: string
  confirmacaoSenha: string
}

export interface CadastroValido {
  nome: string
  email: Email
  telefone: Telefone
  senha: string
}

export type ErrosCadastro = Partial<Record<keyof DadosCadastro, string>>

export const SENHA_MIN = 8

export function validarCadastro(d: DadosCadastro): Result<CadastroValido, ErrosCadastro> {
  const erros: ErrosCadastro = {}
  const nome = d.nome.trim().replace(/\s+/g, ' ')

  if (nome.length < 2) erros.nome = 'Informe seu nome completo.'
  else if (nome.length > 120) erros.nome = 'Nome muito longo.'

  const email = criarEmail(d.email)
  if (!email.ok) erros.email = email.error

  const telefone = criarTelefone(d.telefone)
  if (!telefone.ok) erros.telefone = telefone.error

  if (d.senha.length < SENHA_MIN) erros.senha = `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`
  if (d.senha !== d.confirmacaoSenha) erros.confirmacaoSenha = 'As senhas não conferem.'

  if (Object.keys(erros).length || !email.ok || !telefone.ok) return fail(erros)
  return ok({ nome, email: email.value, telefone: telefone.value, senha: d.senha })
}
