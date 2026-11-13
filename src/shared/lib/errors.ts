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
