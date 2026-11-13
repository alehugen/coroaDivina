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

function validarNome(valor: string): Result<string> {
  const nome = valor.trim().replace(/\s+/g, ' ')
  if (nome.length < 2) return fail('Informe seu nome completo.')
  if (nome.length > 120) return fail('Nome muito longo.')
  return ok(nome)
}

export interface DadosPerfil {
  nome: string
  telefone: string
}

export type ErrosPerfil = Partial<Record<keyof DadosPerfil, string>>

/** Dados editáveis pelo próprio sócio (e-mail não muda por aqui). */
export function validarPerfil(d: DadosPerfil): Result<{ nome: string; telefone: Telefone }, ErrosPerfil> {
  const nome = validarNome(d.nome)
  const telefone = criarTelefone(d.telefone)
  if (!nome.ok || !telefone.ok) {
    return fail({
      ...(nome.ok ? {} : { nome: nome.error }),
      ...(telefone.ok ? {} : { telefone: telefone.error }),
    })
  }
  return ok({ nome: nome.value, telefone: telefone.value })
}

export function validarCadastro(d: DadosCadastro): Result<CadastroValido, ErrosCadastro> {
  const erros: ErrosCadastro = {}
  const nomeV = validarNome(d.nome)
  const nome = nomeV.ok ? nomeV.value : ''
  if (!nomeV.ok) erros.nome = nomeV.error

  const email = criarEmail(d.email)
  if (!email.ok) erros.email = email.error

  const telefone = criarTelefone(d.telefone)
  if (!telefone.ok) erros.telefone = telefone.error

  if (d.senha.length < SENHA_MIN) erros.senha = `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`
  if (d.senha !== d.confirmacaoSenha) erros.confirmacaoSenha = 'As senhas não conferem.'

  if (Object.keys(erros).length || !email.ok || !telefone.ok) return fail(erros)
  return ok({ nome, email: email.value, telefone: telefone.value, senha: d.senha })
}
