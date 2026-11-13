import { addDays, addMonths, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Datas de calendário trafegam como ISO 'yyyy-MM-dd' (sem fuso), igual ao tipo `date` do Postgres. */
export type DataISO = string

const ISO = 'yyyy-MM-dd'

export const hojeISO = (): DataISO => format(new Date(), ISO)
export const somarDias = (d: DataISO, n: number): DataISO => format(addDays(parseISO(d), n), ISO)
export const somarMeses = (d: DataISO, n: number): DataISO => format(addMonths(parseISO(d), n), ISO)

/** Aceita 'yyyy-MM-dd' ou timestamp ISO completo. */
export const formatarData = (d: string, padrao = 'dd/MM/yyyy'): string =>
  format(parseISO(d), padrao, { locale: ptBR })
