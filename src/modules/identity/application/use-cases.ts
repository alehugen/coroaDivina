import { traduzErro } from '@/shared/lib/errors'
import { fail, ok, type Result } from '@/shared/lib/result'
import {
  SENHA_MIN,
  validarCadastro,
  validarPerfil,
  type DadosCadastro,
  type DadosPerfil,
  type ErrosCadastro,
  type ErrosPerfil,
} from '../domain/Cadastro'
import { criarEmail } from '../domain/Email'
import type { AuthRepository } from './ports/AuthRepository'

export type ErrosCadastroUI = ErrosCadastro & { geral?: string }

export function criarUseCasesIdentidade(repo: AuthRepository) {
  return {
    async cadastrarSocio(
      dados: DadosCadastro,
    ): Promise<Result<{ precisaConfirmarEmail: boolean }, ErrosCadastroUI>> {
      const v = validarCadastro(dados)
      if (!v.ok) return v
      try {
        return ok(await repo.cadastrar(v.value))
      } catch (e) {
        return fail({ geral: traduzErro(e) })
      }
    },

    async entrar(email: string, senha: string): Promise<Result<void>> {
      const e = criarEmail(email)
      if (!e.ok) return e
      if (!senha) return fail('Informe a senha.')
      try {
        await repo.entrar(e.value, senha)
        return ok(undefined)
      } catch (err) {
        return fail(traduzErro(err))
      }
    },

    async solicitarRedefinicao(email: string, redirectTo: string): Promise<Result<void>> {
      const e = criarEmail(email)
      if (!e.ok) return e
      try {
        await repo.solicitarRedefinicaoSenha(e.value, redirectTo)
        return ok(undefined)
      } catch (err) {
        return fail(traduzErro(err))
      }
    },

    async atualizarPerfil(id: string, dados: DadosPerfil): Promise<Result<void, ErrosPerfil & { geral?: string }>> {
      const v = validarPerfil(dados)
      if (!v.ok) return v
      try {
        await repo.atualizarPerfil(id, v.value)
        return ok(undefined)
      } catch (e) {
        return fail({ geral: traduzErro(e) })
      }
    },

    async redefinirSenha(senha: string, confirmacao: string): Promise<Result<void>> {
      if (senha.length < SENHA_MIN)
        return fail(`A senha deve ter pelo menos ${SENHA_MIN} caracteres.`)
      if (senha !== confirmacao) return fail('As senhas não conferem.')
      try {
        await repo.redefinirSenha(senha)
        return ok(undefined)
      } catch (err) {
        return fail(traduzErro(err))
      }
    },
  }
}
