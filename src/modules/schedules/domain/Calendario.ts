import type { DataISO } from '@/shared/lib/datas'
import type { Escala, StatusEscala } from './Escala'

export {
  DIAS_SEMANA,
  mesDe,
  rotuloMes,
  semanasDoMes,
  somarMes,
  type DiaCalendario,
} from '@/shared/lib/calendario'

export interface EventoDia {
  escalaId: string
  titulo: string
  status: StatusEscala
  /** O usuário tem alguma função nesse dia dessa escala. */
  souEscalado: boolean
}

/**
 * Junta os dias de cada escala com as inscrições do usuário, por data.
 * `minhas` = pares (escalaId, data) em que o usuário está escalado.
 */
export function eventosPorData(
  dias: { escalaId: string; data: DataISO }[],
  escalas: Pick<Escala, 'id' | 'titulo' | 'status'>[],
  minhas: { escalaId: string; data: DataISO }[],
): Map<DataISO, EventoDia[]> {
  const porId = new Map(escalas.map((e) => [e.id, e]))
  const minhasSet = new Set(minhas.map((m) => `${m.escalaId}|${m.data}`))
  const mapa = new Map<DataISO, EventoDia[]>()
  for (const d of dias) {
    const e = porId.get(d.escalaId)
    if (!e) continue
    const lista = mapa.get(d.data) ?? []
    lista.push({ escalaId: e.id, titulo: e.titulo, status: e.status, souEscalado: minhasSet.has(`${e.id}|${d.data}`) })
    mapa.set(d.data, lista)
  }
  return mapa
}
