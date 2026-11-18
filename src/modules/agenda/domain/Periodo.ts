import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { rotuloMes } from '@/shared/lib/calendario'
import { formatarData, type DataISO } from '@/shared/lib/datas'

export type TipoPeriodo = 'dia' | 'semana' | 'mes' | 'ano'

/** Recorte da agenda: o dia, a semana (domingo a sábado), o mês ou o ano que contém `data`. */
export interface Periodo {
  tipo: TipoPeriodo
  data: DataISO
}

export const TIPOS_PERIODO: { valor: TipoPeriodo; rotulo: string }[] = [
  { valor: 'dia', rotulo: 'Dia' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
  { valor: 'ano', rotulo: 'Ano' },
]

const iso = (d: Date): DataISO => format(d, 'yyyy-MM-dd')

export function intervaloDoPeriodo({ tipo, data }: Periodo): { de: DataISO; ate: DataISO } {
  const d = parseISO(data)
  switch (tipo) {
    case 'dia':
      return { de: data, ate: data }
    case 'semana':
      return { de: iso(startOfWeek(d, { weekStartsOn: 0 })), ate: iso(endOfWeek(d, { weekStartsOn: 0 })) }
    case 'mes':
      return { de: iso(startOfMonth(d)), ate: iso(endOfMonth(d)) }
    case 'ano':
      return { de: iso(startOfYear(d)), ate: iso(endOfYear(d)) }
  }
}

/** Período anterior (n = -1) ou seguinte (n = 1). */
export function somarPeriodo(p: Periodo, n: number): Periodo {
  const d = parseISO(p.data)
  const somado = {
    dia: () => addDays(d, n),
    semana: () => addDays(d, n * 7),
    mes: () => addMonths(d, n),
    ano: () => addYears(d, n),
  }[p.tipo]()
  return { tipo: p.tipo, data: iso(somado) }
}

/** "15/11 a 21/11/2026" (com o ano nas duas pontas quando a semana vira o ano). */
function rotuloSemanaDoPeriodo(p: Periodo): string {
  const { de, ate } = intervaloDoPeriodo(p)
  const inicio = de.slice(0, 4) === ate.slice(0, 4) ? 'dd/MM' : 'dd/MM/yyyy'
  return `${formatarData(de, inicio)} a ${formatarData(ate)}`
}

/** Para a navegação: "Quarta-feira, 18 de novembro de 2026", "15/11 a 21/11/2026", "Novembro de 2026", "2026". */
export function rotuloPeriodo(p: Periodo): string {
  const d = parseISO(p.data)
  switch (p.tipo) {
    case 'dia': {
      const s = format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
    case 'semana':
      return rotuloSemanaDoPeriodo(p)
    case 'mes':
      return rotuloMes(d.getFullYear(), d.getMonth())
    case 'ano':
      return String(d.getFullYear())
  }
}

/** Para o cabeçalho da folha e da mensagem: "NOVEMBRO 2026", "SEMANA DE 15/11 A 21/11/2026"... */
export function tituloPeriodo(p: Periodo): string {
  const d = parseISO(p.data)
  switch (p.tipo) {
    case 'dia':
      return format(d, 'EEEE, dd/MM/yyyy', { locale: ptBR }).toUpperCase()
    case 'semana':
      return `SEMANA DE ${rotuloSemanaDoPeriodo(p).toUpperCase()}`
    case 'mes':
      return rotuloMes(d.getFullYear(), d.getMonth()).replace(' de ', ' ').toUpperCase()
    case 'ano':
      return String(d.getFullYear())
  }
}
