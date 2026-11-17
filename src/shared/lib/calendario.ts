import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DataISO } from './datas'

/** Grade mensal genérica (usada pelo calendário de escalas e pela agenda). */
export interface DiaCalendario {
  data: DataISO
  numero: number
  noMes: boolean
  hoje: boolean
}

/** Mês como lista de semanas (domingo a sábado), incluindo dias das bordas. `mes` vai de 0 a 11. */
export function semanasDoMes(ano: number, mes: number, hoje: DataISO): DiaCalendario[][] {
  const primeiro = startOfMonth(new Date(ano, mes, 1))
  const inicio = startOfWeek(primeiro, { weekStartsOn: 0 })
  const fim = endOfWeek(endOfMonth(primeiro), { weekStartsOn: 0 })

  const semanas: DiaCalendario[][] = []
  for (let d = inicio; d <= fim; d = addDays(d, 1)) {
    if (d.getDay() === 0) semanas.push([])
    const data = format(d, 'yyyy-MM-dd')
    semanas[semanas.length - 1]!.push({ data, numero: d.getDate(), noMes: d.getMonth() === mes, hoje: data === hoje })
  }
  return semanas
}

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

/** "Novembro de 2026" */
export function rotuloMes(ano: number, mes: number): string {
  const s = format(new Date(ano, mes, 1), "MMMM 'de' yyyy", { locale: ptBR })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function mesDe(data: DataISO): { ano: number; mes: number } {
  const d = parseISO(data)
  return { ano: d.getFullYear(), mes: d.getMonth() }
}

export function somarMes(ref: { ano: number; mes: number }, n: number): { ano: number; mes: number } {
  const d = new Date(ref.ano, ref.mes + n, 1)
  return { ano: d.getFullYear(), mes: d.getMonth() }
}
