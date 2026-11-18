import { isValid, parseISO } from 'date-fns'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { hojeISO, type DataISO } from '@/shared/lib/datas'
import { TIPOS_PERIODO, type Periodo, type TipoPeriodo } from '../../domain/Periodo'

const dataValida = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && isValid(parseISO(v))

/** Período exportado, guardado na URL (?periodo=semana&data=2026-11-18). Aceita o link antigo ?mes=2026-11. */
export function usePeriodoDaQuery() {
  const route = useRoute()
  const router = useRouter()

  const periodo = computed<Periodo>(() => {
    const q = String(route.query.periodo ?? '')
    const tipo: TipoPeriodo = TIPOS_PERIODO.find((t) => t.valor === q)?.valor ?? 'mes'
    const data = String(route.query.data ?? '')
    const doMes = `${String(route.query.mes ?? '')}-01`
    const valida: DataISO | undefined = [data, doMes].find(dataValida)
    return { tipo, data: valida ?? hojeISO() }
  })

  const irPara = (p: Periodo) => router.replace({ query: { periodo: p.tipo, data: p.data } })

  return { periodo, irPara }
}
