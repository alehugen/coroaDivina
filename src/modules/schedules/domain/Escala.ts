import { eachDayOfInterval, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatarData, type DataISO } from '@/shared/lib/datas'
import { fail, ok, type Result } from '@/shared/lib/result'

// ---------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------
export type StatusEscala = 'rascunho' | 'aberta' | 'fechada' | 'arquivada'
export type Papel = 'responsavel' | 'auxiliar'

export interface Escala {
  id: string
  titulo: string
  descricao: string | null
  dataInicio: DataISO
  dataFim: DataISO
  status: StatusEscala
}

export interface ResumoEscala {
  dias: number
  vagas: number
  ocupadas: number
}

export interface EscalaComResumo extends Escala {
  resumo: ResumoEscala
}

export interface AreaRef {
  id: string
  nome: string
  cor: string
  ordem: number
}

export interface Inscricao {
  id: string
  profileId: string
  nome: string
  papel: Papel
  criadoEm: string
}

export interface FuncaoDoDia {
  id: string
  diaId: string
  area: AreaRef
  funcaoModeloId: string | null
  nome: string
  ordem: number
  vagasResp: number
  vagasAux: number
  ativa: boolean
  inscricoes: Inscricao[]
}

export interface DiaEscala {
  id: string
  data: DataISO
  observacoes: string
  funcoes: FuncaoDoDia[]
}

export interface EscalaDetalhada extends Escala {
  dias: DiaEscala[]
}

// ---------------------------------------------------------------------
// Status e transições
// ---------------------------------------------------------------------
export const STATUS_INFO: Record<
  StatusEscala,
  { rotulo: string; tom: 'neutral' | 'primary' | 'accent' | 'warning'; descricao: string }
> = {
  rascunho: {
    rotulo: 'Rascunho',
    tom: 'neutral',
    descricao: 'Visível só para admins e Orgãs. Monte os dias e funções antes de abrir.',
  },
  aberta: {
    rotulo: 'Inscrições abertas',
    tom: 'primary',
    descricao: 'Sócios podem ver a escala e se inscrever nas vagas livres.',
  },
  fechada: {
    rotulo: 'Inscrições encerradas',
    tom: 'warning',
    descricao: 'Sócios veem a escala, mas não podem mais se inscrever nem cancelar.',
  },
  arquivada: {
    rotulo: 'Arquivada',
    tom: 'neutral',
    descricao: 'Fora das listas. Visível só para admins e Orgãs.',
  },
}

export interface Transicao {
  para: StatusEscala
  rotulo: string
  principal?: boolean
}

export const TRANSICOES: Record<StatusEscala, Transicao[]> = {
  rascunho: [
    { para: 'aberta', rotulo: 'Abrir inscrições', principal: true },
    { para: 'arquivada', rotulo: 'Arquivar' },
  ],
  aberta: [{ para: 'fechada', rotulo: 'Encerrar inscrições' }],
  fechada: [
    { para: 'aberta', rotulo: 'Reabrir inscrições' },
    { para: 'arquivada', rotulo: 'Arquivar' },
  ],
  arquivada: [{ para: 'fechada', rotulo: 'Desarquivar' }],
}

// ---------------------------------------------------------------------
// Vagas
// ---------------------------------------------------------------------
export interface Ocupacao {
  resp: number
  aux: number
  livresResp: number
  livresAux: number
  total: number
  vagas: number
}

export function ocupacao(f: Pick<FuncaoDoDia, 'vagasResp' | 'vagasAux' | 'inscricoes'>): Ocupacao {
  const resp = f.inscricoes.filter((i) => i.papel === 'responsavel').length
  const aux = f.inscricoes.length - resp
  return {
    resp,
    aux,
    livresResp: Math.max(0, f.vagasResp - resp),
    livresAux: Math.max(0, f.vagasAux - aux),
    total: f.inscricoes.length,
    vagas: f.vagasResp + f.vagasAux,
  }
}

export const percentual = (ocupadas: number, vagas: number) =>
  vagas ? Math.min(100, Math.round((ocupadas / vagas) * 100)) : 0

/** Agrupa as funções de um dia por área (ordem da área, depois da função). */
export function funcoesPorArea(funcoes: FuncaoDoDia[]): { area: AreaRef; funcoes: FuncaoDoDia[] }[] {
  const mapa = new Map<string, { area: AreaRef; funcoes: FuncaoDoDia[] }>()
  for (const f of funcoes) {
    if (!mapa.has(f.area.id)) mapa.set(f.area.id, { area: f.area, funcoes: [] })
    mapa.get(f.area.id)!.funcoes.push(f)
  }
  return [...mapa.values()]
    .sort((a, b) => a.area.ordem - b.area.ordem || a.area.nome.localeCompare(b.area.nome, 'pt-BR'))
    .map((g) => ({
      ...g,
      funcoes: g.funcoes.sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR')),
    }))
}

// ---------------------------------------------------------------------
// Datas e textos
// ---------------------------------------------------------------------
export const MAX_DIAS_ESCALA = 62

export function diasNoPeriodo(inicio: DataISO, fim: DataISO): DataISO[] {
  if (!inicio || !fim || fim < inicio) return []
  return eachDayOfInterval({ start: parseISO(inicio), end: parseISO(fim) })
    .slice(0, MAX_DIAS_ESCALA)
    .map((d) => format(d, 'yyyy-MM-dd'))
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "Sexta-feira | 20 Nov" (como na planilha) */
export const rotuloDia = (data: DataISO) =>
  `${capitalizar(formatarData(data, 'EEEE'))} | ${formatarData(data, 'dd')} ${capitalizar(formatarData(data, 'MMM'))}`

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

/** "Sex 20/11" */
export const rotuloDiaCurto = (data: DataISO) =>
  `${DIAS_CURTOS[parseISO(data).getDay()]} ${formatarData(data, 'dd/MM')}`

/** "20/11 a 23/11/2026" */
export function rotuloPeriodo(inicio: DataISO, fim: DataISO): string {
  if (inicio === fim) return formatarData(inicio)
  const mesmoAno = inicio.slice(0, 4) === fim.slice(0, 4)
  return `${formatarData(inicio, mesmoAno ? 'dd/MM' : 'dd/MM/yyyy')} a ${formatarData(fim)}`
}

export const tituloSugerido = (inicio: DataISO) =>
  `Escala do Preparo – ${capitalizar(format(parseISO(inicio), 'MMM yyyy', { locale: ptBR }))}`

/**
 * Texto de Orgã(s) da escala, como no cabeçalho da planilha:
 * "Lucielma (até 21/11) e Isis (desde 22/11)".
 */
export function descreverOrgas(
  mandatos: { nome: string; inicio: DataISO; fim: DataISO }[],
  inicio: DataISO,
  fim: DataISO,
): string {
  const ativos = mandatos
    .filter((m) => m.inicio <= fim && m.fim >= inicio)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
  return ativos
    .map((m) => {
      const partes: string[] = []
      if (m.inicio > inicio) partes.push(`desde ${formatarData(m.inicio, 'dd/MM')}`)
      if (m.fim < fim) partes.push(`até ${formatarData(m.fim, 'dd/MM')}`)
      return partes.length ? `${m.nome} (${partes.join(', ')})` : m.nome
    })
    .join(' e ')
}

// ---------------------------------------------------------------------
// Validações
// ---------------------------------------------------------------------
export interface NovaEscala {
  titulo: string
  descricao: string
  datas: DataISO[]
  funcaoModeloIds: string[]
}

export function validarNovaEscala(d: NovaEscala): Result<NovaEscala> {
  const titulo = d.titulo.trim()
  if (titulo.length < 3) return fail('Informe o título da escala.')
  if (!d.datas.length) return fail('Selecione pelo menos um dia.')
  if (d.datas.length > MAX_DIAS_ESCALA) return fail(`Uma escala pode ter no máximo ${MAX_DIAS_ESCALA} dias.`)
  if (!d.funcaoModeloIds.length) return fail('Selecione pelo menos uma função.')
  return ok({ ...d, titulo, descricao: d.descricao.trim(), datas: [...new Set(d.datas)].sort() })
}

export interface NovaFuncaoDia {
  areaId: string
  nome: string
  vagasResp: number
  vagasAux: number
  funcaoModeloId: string | null
}

export function validarNovaFuncaoDia(d: NovaFuncaoDia, existentes: FuncaoDoDia[]): Result<NovaFuncaoDia> {
  const nome = d.nome.trim()
  if (!d.areaId) return fail('Escolha a área.')
  if (nome.length < 2) return fail('Informe o nome da função.')
  if (d.vagasResp + d.vagasAux === 0) return fail('A função precisa ter pelo menos uma vaga.')
  if (existentes.some((f) => f.nome.toLowerCase() === nome.toLowerCase()))
    return fail('Esse dia já tem uma função com esse nome.')
  return ok({ ...d, nome })
}
