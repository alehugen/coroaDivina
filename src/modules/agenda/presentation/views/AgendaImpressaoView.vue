<script setup lang="ts">
import { PhArrowLeft, PhCaretLeft, PhCaretRight, PhCopy, PhPrinter, PhWarningCircle, PhWhatsappLogo } from '@phosphor-icons/vue'
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/shared/composables/useToast'
import { mesDe, rotuloMes, somarMes } from '@/shared/lib/calendario'
import { formatarData, hojeISO } from '@/shared/lib/datas'
import { agruparPorData, eventosDoMes, rotuloSemana, textoWhatsAppAgenda, type CorEvento } from '../../domain/Evento'
import { useAgendaStore } from '../stores/agenda'

const store = useAgendaStore()
const route = useRoute()
const router = useRouter()

const mes = computed(() => {
  const q = String(route.query.mes ?? '')
  return /^\d{4}-\d{2}$/.test(q) ? mesDe(`${q}-01`) : mesDe(hojeISO())
})
const chaveMes = computed(() => `${mes.value.ano}-${String(mes.value.mes + 1).padStart(2, '0')}`)
const irPara = (m: { ano: number; mes: number }) =>
  router.replace({ query: { mes: `${m.ano}-${String(m.mes + 1).padStart(2, '0')}` } })

onMounted(() => (store.carregado ? store.garantirMes(mes.value.ano, mes.value.mes) : store.carregar(`${chaveMes.value}-01`)))
watch(mes, (m) => store.garantirMes(m.ano, m.mes))

const grupos = computed(() => agruparPorData(eventosDoMes(store.eventos, mes.value.ano, mes.value.mes)))
const nomeMes = computed(() => rotuloMes(mes.value.ano, mes.value.mes).split(' de ')[0]!.toUpperCase())

const texto = computed(() =>
  textoWhatsAppAgenda(store.eventos, mes.value.ano, mes.value.mes, `${window.location.origin}/agenda?mes=${chaveMes.value}`),
)

async function copiar() {
  try {
    await navigator.clipboard.writeText(texto.value)
    toast('Texto copiado. É só colar no WhatsApp.')
  } catch {
    toast('Não foi possível copiar automaticamente.', 'danger')
  }
}
const abrirWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(texto.value)}`, '_blank', 'noopener')
const imprimir = () => window.print()

function voltar() {
  if (window.history.length > 1) router.back()
  else router.push({ path: '/agenda', query: { mes: chaveMes.value } })
}

/** Cores da tabela usada hoje (impressão sempre em fundo branco). */
const LINHA: Record<CorEvento, string> = { nenhuma: '', amarela: 'bg-[#ffff99]', verde: 'bg-[#92d050]' }
</script>

<template>
  <div class="min-h-dvh bg-muted print:bg-white">
    <!-- Barra de ações (não sai na impressão) -->
    <div class="sticky top-0 z-10 border-b bg-card/95 backdrop-blur print:hidden">
      <div class="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
        <Button variant="ghost" class="-ml-2 text-muted-foreground" @click="voltar"><PhArrowLeft /> Voltar</Button>
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Mês anterior" @click="irPara(somarMes(mes, -1))"><PhCaretLeft /></Button>
          <span class="min-w-36 text-center font-semibold">{{ rotuloMes(mes.ano, mes.mes) }}</span>
          <Button variant="ghost" size="icon" aria-label="Próximo mês" @click="irPara(somarMes(mes, 1))"><PhCaretRight /></Button>
        </div>
        <div class="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
          <Button variant="outline" size="lg" :disabled="!store.carregado" @click="copiar"><PhCopy /> Copiar texto</Button>
          <Button variant="outline" size="lg" :disabled="!store.carregado" @click="abrirWhatsApp">
            <PhWhatsappLogo /> WhatsApp
          </Button>
          <Button size="lg" :disabled="!store.carregado" @click="imprimir"><PhPrinter /> Imprimir / PDF</Button>
        </div>
      </div>
    </div>

    <div v-if="store.carregando && !store.carregado" class="flex justify-center py-16 text-primary print:hidden">
      <Spinner class="size-6" />
    </div>

    <div v-else-if="store.erro" class="mx-auto max-w-xl p-6">
      <Alert variant="destructive">
        <PhWarningCircle />
        <AlertDescription>{{ store.erro }}</AlertDescription>
      </Alert>
    </div>

    <!-- Folha (A4 retrato), no layout da tabela usada hoje -->
    <div v-else class="overflow-x-auto px-4 py-6 print:overflow-visible print:p-0">
      <section
        class="folha-agenda mx-auto w-[190mm] bg-white p-[8mm] text-[10.5pt] leading-snug text-black shadow-md print:w-auto print:p-0 print:shadow-none"
      >
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th colspan="3" class="border border-black bg-[#0b4d2c] py-1.5 text-center text-[12pt] font-bold text-white">
                {{ nomeMes }} {{ mes.ano }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!grupos.length">
              <td colspan="3" class="border border-black px-2 py-4 text-center italic">Nenhum evento cadastrado neste mês.</td>
            </tr>
            <template v-for="g in grupos" :key="g.data">
              <tr v-for="(e, k) in g.eventos" :key="e.id" :class="LINHA[e.cor]" class="break-inside-avoid">
                <td
                  v-if="k === 0"
                  :rowspan="g.eventos.length"
                  class="w-[17mm] border border-black px-1.5 text-center font-bold tabular-nums"
                  :class="LINHA[g.eventos[0]!.cor]"
                >
                  {{ formatarData(g.data, 'dd/MM') }}
                </td>
                <td
                  v-if="k === 0"
                  :rowspan="g.eventos.length"
                  class="w-[30mm] border border-black px-1.5 text-center font-bold"
                  :class="LINHA[g.eventos[0]!.cor]"
                >
                  {{ rotuloSemana(g.data) }}
                </td>
                <td class="border border-black px-2 py-0.5">
                  <span class="font-bold"><template v-if="e.hora">{{ e.hora }} · </template>{{ e.titulo }}</span>
                  <template v-if="e.detalhe"> – {{ e.detalhe }}</template>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <p class="mt-2 text-right text-[8pt] text-neutral-500">Núcleo Coroa Divina</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.folha-agenda {
  page: agenda;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
</style>
