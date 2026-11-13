import {
  funcoesPorArea,
  ocupacao,
  rotuloDia,
  rotuloPeriodo,
  type DiaEscala,
  type EscalaDetalhada,
  type FuncaoDoDia,
  type Papel,
} from './Escala'

/** Uma linha numerada do bloco da função (como na planilha). `nome` null = vaga em branco. */
export interface LinhaVaga {
  numero: number
  papel: Papel
  nome: string | null
}

/**
 * Linhas da função na ordem da planilha: primeiro as vagas de responsável, depois as de auxiliar.
 * Inscritos além das vagas (se a Orgã reduziu depois) também aparecem, para ninguém sumir.
 */
export function linhasDaFuncao(f: FuncaoDoDia): LinhaVaga[] {
  const porPapel = (papel: Papel, vagas: number) => {
    const nomes = f.inscricoes.filter((i) => i.papel === papel).map((i) => i.nome)
    const total = Math.max(vagas, nomes.length)
    return Array.from({ length: total }, (_, k) => ({ papel, nome: nomes[k] ?? null }))
  }
  return [...porPapel('responsavel', f.vagasResp), ...porPapel('auxiliar', f.vagasAux)].map((l, k) => ({
    ...l,
    numero: k + 1,
  }))
}

export interface OpcoesTexto {
  /** Dias a incluir (padrão: todos). */
  diaIds?: string[]
  /** Linha da Orgã, já formatada. */
  orgas?: string
  /** Link para a escala no app (vai no fim da mensagem). */
  link?: string
}

function linhaFuncao(f: FuncaoDoDia): string {
  const o = ocupacao(f)
  const resp = f.inscricoes.filter((i) => i.papel === 'responsavel').map((i) => `★ ${i.nome}`)
  const aux = f.inscricoes.filter((i) => i.papel === 'auxiliar').map((i) => i.nome)
  const nomes = [...resp, ...aux].join(', ')
  const livres = o.livresResp + o.livresAux
  const situacao = livres === 0 ? '✅' : `(${livres === 1 ? 'falta 1' : `faltam ${livres}`})`
  return `• ${f.nome}: ${nomes || '_ninguém ainda_'} ${situacao}`
}

function blocoDia(d: DiaEscala): string[] {
  const linhas = [`*${rotuloDia(d.data)}*`]
  for (const g of funcoesPorArea(d.funcoes.filter((f) => f.ativa))) {
    linhas.push(`_${g.area.nome}_`, ...g.funcoes.map(linhaFuncao))
  }
  if (d.observacoes.trim()) linhas.push(`📝 ${d.observacoes.trim()}`)
  return linhas
}

/**
 * Resumo da escala em texto para colar no WhatsApp
 * (*negrito*, _itálico_; ★ = responsável).
 */
export function textoWhatsApp(e: EscalaDetalhada, opcoes: OpcoesTexto = {}): string {
  const dias = opcoes.diaIds ? e.dias.filter((d) => opcoes.diaIds!.includes(d.id)) : e.dias
  const partes: string[][] = [
    [
      `*${e.titulo}*`,
      rotuloPeriodo(e.dataInicio, e.dataFim),
      ...(opcoes.orgas ? [`Orgã: ${opcoes.orgas}`] : []),
    ],
    ...dias.map(blocoDia),
  ]
  if (opcoes.link) partes.push([`Escolha suas funções: ${opcoes.link}`])
  return partes.map((p) => p.join('\n')).join('\n\n')
}
