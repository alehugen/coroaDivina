import type { CadastroValido } from '../../domain/Cadastro'
import type { Conta } from '../../domain/Conta'

export interface AuthRepository {
  cadastrar(dados: CadastroValido): Promise<{ precisaConfirmarEmail: boolean }>
  entrar(email: string, senha: string): Promise<void>
  sair(): Promise<void>
  /** Retorna a conta do usuário logado (ou null se não houver sessão). */
  contaAtual(): Promise<Conta | null>
  solicitarRedefinicaoSenha(email: string, redirectTo: string): Promise<void>
  redefinirSenha(novaSenha: string): Promise<void>
  atualizarPerfil(id: string, dados: { nome: string; telefone: string }): Promise<void>
  /** Notifica login/logout/refresh. Retorna função para cancelar. */
  aoMudarSessao(cb: (evento: string) => void): () => void
}
