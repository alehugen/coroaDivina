/** Grau do sócio no núcleo. Todo cadastro novo entra como QS. */
export type Grau = 'QS' | 'CI' | 'CDC' | 'QM'

/** Do menor para o maior. */
export const GRAUS: readonly Grau[] = ['QS', 'CI', 'CDC', 'QM']

export const NOME_GRAU: Record<Grau, string> = {
  QS: 'Quadro de Sócios',
  CI: 'Corpo Instrutivo',
  CDC: 'Corpo do Conselho',
  QM: 'Quadro de Mestres',
}

/** Só CDC e QM podem exercer o mandato de Orgã (e gerenciar escalas durante ele). */
export const podeSerOrga = (g: Grau) => g === 'CDC' || g === 'QM'
