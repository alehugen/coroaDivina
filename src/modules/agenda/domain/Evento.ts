import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { rotuloMes } from '@/shared/lib/calendario'
import type { DataISO } from '@/shared/lib/datas'
import { fail, ok, type Result } from '@/shared/lib/result'

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

/**
 * Agenda do mês em texto para o WhatsApp (*negrito*, _itálico_).
 * 🟡/🟢 repetem os destaques da tabela.
 */
export function textoWhatsAppAgenda(lista: Evento[], ano: number, mes: number, link?: string): string {
  const titulo = rotuloMes(ano, mes).replace(' de ', ' ').toUpperCase()
  const partes: string[] = [`🗓️ *AGENDA – ${titulo}*\n_Núcleo Coroa Divina_`]
  const grupos = agruparPorData(eventosDoMes(lista, ano, mes))
  if (!grupos.length) partes.push('_Nenhum evento cadastrado neste mês._')
  for (const g of grupos) {
    partes.push([`*${format(parseISO(g.data), 'dd/MM')} · ${rotuloSemana(g.data)}*`, ...g.eventos.map(linhaEvento)].join('\n'))
  }
  if (link) partes.push(`Agenda completa: ${link}`)
  return partes.join('\n\n')
}
