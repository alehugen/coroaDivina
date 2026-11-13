import { somarDias, somarMeses, type DataISO } from '@/shared/lib/datas'
import { fail, ok, type Result } from '@/shared/lib/result'

/** Mandato de Orgã: cargo rotativo (em geral, 2 meses) definido pelo admin. */
export interface Mandato {
  id: string
  profileId: string
  nome: string
  inicio: DataISO
  fim: DataISO
}

export type SituacaoMandato = 'vigente' | 'futuro' | 'encerrado'

export const DURACAO_PADRAO_MESES = 2

// Datas ISO 'yyyy-MM-dd' são comparáveis como string.
export function situacao(m: Pick<Mandato, 'inicio' | 'fim'>, hoje: DataISO): SituacaoMandato {
  if (hoje < m.inicio) return 'futuro'
  if (hoje > m.fim) return 'encerrado'
  return 'vigente'
}

/** Ex.: início 01/11 → fim 31/12 */
export const fimSugerido = (inicio: DataISO): DataISO =>
  somarDias(somarMeses(inicio, DURACAO_PADRAO_MESES), -1)

export interface NovoMandato {
  profileId: string
  inicio: DataISO
  fim: DataISO
}

export function validarMandato(m: NovoMandato): Result<NovoMandato> {
  if (!m.profileId) return fail('Escolha o sócio.')
  if (!m.inicio || !m.fim) return fail('Informe início e fim.')
  if (m.fim < m.inicio) return fail('O fim deve ser igual ou posterior ao início.')
  return ok(m)
}

const sobrepoe = (a: Pick<Mandato, 'inicio' | 'fim'>, b: Pick<Mandato, 'inicio' | 'fim'>) =>
  a.inicio <= b.fim && b.inicio <= a.fim

/** Mandatos de OUTRAS pessoas no mesmo período (permitido, mas vale avisar). */
export const sobreposicoes = (novo: NovoMandato, existentes: Mandato[]): Mandato[] =>
  existentes.filter((m) => m.profileId !== novo.profileId && sobrepoe(m, novo))

/** A mesma pessoa já tem mandato cobrindo parte do período. */
export const duplicado = (novo: NovoMandato, existentes: Mandato[]): boolean =>
  existentes.some((m) => m.profileId === novo.profileId && sobrepoe(m, novo))

/**
 * Encerrar "agora": a permissão deve acabar já hoje, então o fim vira ontem.
 * Se o mandato nem começou (ou começa hoje), basta removê-lo.
 */
export function planoEncerramento(
  m: Mandato,
  hoje: DataISO,
): { acao: 'remover' } | { acao: 'encurtar'; fim: DataISO } {
  return m.inicio >= hoje ? { acao: 'remover' } : { acao: 'encurtar', fim: somarDias(hoje, -1) }
}
