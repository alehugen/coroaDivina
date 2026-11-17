import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chaveDoMes, mesDe, type MesRef } from '@/shared/lib/calendario'
import { hojeISO } from '@/shared/lib/datas'

/** Mês exibido, guardado na URL (?mes=2026-11): voltar, recarregar e links compartilhados mantêm o mês. */
export function useMesDaQuery() {
  const route = useRoute()
  const router = useRouter()

  const mes = computed<MesRef>(() => {
    const q = String(route.query.mes ?? '')
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(q) ? mesDe(`${q}-01`) : mesDe(hojeISO())
  })
  const chave = computed(() => chaveDoMes(mes.value))

  const irPara = (m: MesRef) => router.replace({ query: { ...route.query, mes: chaveDoMes(m) } })

  return { mes, chave, irPara }
}
