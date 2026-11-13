import { fail, ok, type Result } from './result'

/**
 * Traduz erros do Supabase/Postgres (incluindo os códigos lançados pelas RPCs)
 * para mensagens amigáveis em português.
 */
const MENSAGENS: Record<string, string> = {
  // RPCs
  SEM_VAGA: 'Essa vaga acabou de ser preenchida. Escolha outra opção.',
  JA_INSCRITO: 'Você já está inscrito(a) nessa função.',
  ESCALA_FECHADA: 'Essa escala não está aberta para inscrições.',
  FUNCAO_INATIVA: 'Essa função não está disponível neste dia.',
  DATA_PASSADA: 'Não é possível alterar inscrições de dias que já passaram.',
  NAO_APROVADO: 'Seu cadastro ainda não foi aprovado.',
  SEM_PERMISSAO: 'Você não tem permissão para essa ação.',
  VAGAS_MENOR_QUE_INSCRITOS: 'Já há mais inscritos do que esse número de vagas. Remova inscrições antes.',
  ESCALA_SEM_DIAS: 'A escala precisa ter pelo menos um dia.',
  SEM_DIAS: 'Selecione pelo menos um dia.',
  SEM_TITULO: 'Informe o título da escala.',
  DIA_JA_EXISTE: 'Esse dia já faz parte da escala.',
  ESCALA_INEXISTENTE: 'Escala não encontrada.',
  'violates foreign key constraint': 'Não é possível excluir: o item está sendo usado em escalas.',
  'duplicate key value': 'Já existe um item com esse nome.',
  ULTIMO_ADMIN: 'Não é possível: o app precisa ter pelo menos um admin ativo.',
  SOCIO_INVALIDO: 'Sócio inválido ou não aprovado.',
  // Auth
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
  'User already registered': 'Já existe um cadastro com esse e-mail.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
}

export function traduzErro(error: unknown): string {
  const msg =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : ''
  for (const [chave, texto] of Object.entries(MENSAGENS)) {
    if (msg.includes(chave)) return texto
  }
  if (/fetch|network/i.test(msg)) return 'Sem conexão. Verifique sua internet.'
  return 'Algo deu errado. Tente novamente.'
}

/** Executa uma operação de infraestrutura e converte exceções em Result com mensagem amigável. */
export async function tentar<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn())
  } catch (e) {
    return fail(traduzErro(e))
  }
}
