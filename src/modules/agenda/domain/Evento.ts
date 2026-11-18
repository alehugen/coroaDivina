import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DataISO } from '@/shared/lib/datas'
import { fail, ok, type Result } from '@/shared/lib/result'
import { intervaloDoPeriodo, tituloPeriodo, type Periodo } from './Periodo'

/** Destaque da linha, como na tabela usada hoje (amarelo = sessão/atividade; verde = livre). */
export type CorEvento = 'nenhuma' | 'amarela' | 'verde'

export const CORES_EVENTO: { valor: CorEvento; rotulo: string; emoji: string }[] = [
  { valor: 'nenhuma', rotulo: 'Sem destaque', emoji: '•' },
  { valor: 'amarela', rotulo: 'Amarelo', emoji: '🟡' },
  { valor: 'verde', rotulo: 'Verde', emoji: '🟢' },
]

/** Evento da agenda do núcleo. */
export interface Evento {
  id: string
  data: DataISO
  /** 'HH:mm' ou null (dia inteiro / sem horário definido) */
  hora: string | null
  titulo: string
  /** Complemento (ex.: "Eleição Diretoria e Conselho Fiscal") */
  detalhe: string
  cor: CorEvento
}

export type DadosEvento = Omit<Evento, 'id'>

export const MAX_TITULO = 160
export const MAX_DETALHE = 500

export function validarEvento(d: DadosEvento): Result<DadosEvento> {
  const titulo = d.titulo.trim()
  const detalhe = d.detalhe.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data)) return fail('Informe a data.')
  if (titulo.length < 2) return fail('Informe o título do evento.')
  if (titulo.length > MAX_TITULO) return fail(`O título pode ter até ${MAX_TITULO} caracteres.`)
  if (detalhe.length > MAX_DETALHE) return fail(`O complemento pode ter até ${MAX_DETALHE} caracteres.`)
  const hora = d.hora?.trim() ? d.hora.trim().slice(0, 5) : null
  if (hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return fail('Horário inválido.')
  return ok({ data: d.data, hora, titulo, detalhe, cor: d.cor })
}

/**
 * Dia da semana como na tabela: sábados com o número da ocorrência no mês
 * ("1º sábado", "3º sábado"); os demais por extenso ("domingo", "quarta-feira").
 */
export function rotuloSemana(data: DataISO): string {
  const d = parseISO(data)
  const nome = format(d, 'EEEE', { locale: ptBR })
  return d.getDay() === 6 ? `${Math.ceil(d.getDate() / 7)}º ${nome}` : nome
}

/** Ordem do dia: sem horário primeiro, depois por horário; empate pelo título. */
export function ordenarEventos(lista: Evento[]): Evento[] {
  return [...lista].sort(
    (a, b) =>
      a.data.localeCompare(b.data) ||
      (a.hora ?? '').localeCompare(b.hora ?? '') ||
      a.titulo.localeCompare(b.titulo, 'pt-BR'),
  )
}

export function eventosDoMes(lista: Evento[], ano: number, mes: number): Evento[] {
  const prefixo = `${ano}-${String(mes + 1).padStart(2, '0')}-`
  return ordenarEventos(lista.filter((e) => e.data.startsWith(prefixo)))
}

export function eventosDoPeriodo(lista: Evento[], periodo: Periodo): Evento[] {
  const { de, ate } = intervaloDoPeriodo(periodo)
  return ordenarEventos(lista.filter((e) => e.data >= de && e.data <= ate))
}

/** Agrupa (já ordenado) por data, preservando a ordem. */
export function agruparPorData(lista: Evento[]): { data: DataISO; eventos: Evento[] }[] {
  const grupos: { data: DataISO; eventos: Evento[] }[] = []
  for (const e of ordenarEventos(lista)) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.data === e.data) ultimo.eventos.push(e)
    else grupos.push({ data: e.data, eventos: [e] })
  }
  return grupos
}

export function porData(lista: Evento[]): Map<DataISO, Evento[]> {
  return new Map(agruparPorData(lista).map((g) => [g.data, g.eventos]))
}

const emojiDe = (c: CorEvento) => CORES_EVENTO.find((x) => x.valor === c)!.emoji

function linhaEvento(e: Evento): string {
  const partes = [e.hora ? `${e.hora} – ` : '', `*${e.titulo}*`, e.detalhe ? ` – ${e.detalhe}` : '']
  return `${emojiDe(e.cor)} ${partes.join('')}`
}

export interface GrupoDoMes {
  chave: string
  /** "NOVEMBRO" */
  nome: string
  grupos: { data: DataISO; eventos: Evento[] }[]
}

/** Divide os dias por mês (usado na exportação do ano). Meses sem evento não aparecem. */
export function agruparPorMes(lista: Evento[]): GrupoDoMes[] {
  const meses: GrupoDoMes[] = []
  for (const g of agruparPorData(lista)) {
    const chave = g.data.slice(0, 7)
    let mes = meses[meses.length - 1]
    if (mes?.chave !== chave) {
      mes = { chave, nome: format(parseISO(g.data), 'MMMM', { locale: ptBR }).toUpperCase(), grupos: [] }
      meses.push(mes)
    }
    mes.grupos.push(g)
  }
  return meses
}

const blocoDia = (g: { data: DataISO; eventos: Evento[] }) =>
  [`*${format(parseISO(g.data), 'dd/MM')} · ${rotuloSemana(g.data)}*`, ...g.eventos.map(linhaEvento)].join('\n')

/**
 * Agenda do período em texto para o WhatsApp (*negrito*, _itálico_).
 * 🟡/🟢 repetem os destaques da tabela.
 */
export function textoWhatsAppAgenda(lista: Evento[], periodo: Periodo, link?: string): string {
  const partes: string[] = [`🗓️ *AGENDA – ${tituloPeriodo(periodo)}*\n_Núcleo Coroa Divina_`]
  const eventos = eventosDoPeriodo(lista, periodo)
  if (!eventos.length) partes.push('_Nenhum evento cadastrado neste período._')
  else if (periodo.tipo === 'dia') partes.push(eventos.map(linhaEvento).join('\n')) // a data já está no título
  else if (periodo.tipo === 'ano') {
    for (const m of agruparPorMes(eventos)) partes.push(`━━ *${m.nome}* ━━`, ...m.grupos.map(blocoDia))
  } else partes.push(...agruparPorData(eventos).map(blocoDia))
  if (link) partes.push(`Agenda completa: ${link}`)
  return partes.join('\n\n')
}
