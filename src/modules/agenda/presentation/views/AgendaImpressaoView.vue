<script setup lang="ts">
import { PhArrowLeft, PhCaretLeft, PhCaretRight, PhCopy, PhPrinter, PhWarningCircle, PhWhatsappLogo } from '@phosphor-icons/vue'
import { computed, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCompartilhar } from '@/shared/composables/useCompartilhar'
import { formatarData, hojeISO } from '@/shared/lib/datas'
import {
  agruparPorData,
  agruparPorMes,
  eventosDoPeriodo,
  rotuloSemana,
  textoWhatsAppAgenda,
  type CorEvento,
} from '../../domain/Evento'
import {
  intervaloDoPeriodo,
  rotuloPeriodo,
  somarPeriodo,
  tituloPeriodo,
  TIPOS_PERIODO,
  type TipoPeriodo,
} from '../../domain/Periodo'
import { usePeriodoDaQuery } from '../composables/usePeriodoDaQuery'
import { useAgendaStore } from '../stores/agenda'

const store = useAgendaStore()
const { periodo, irPara } = usePeriodoDaQuery()
const hoje = hojeISO()

const intervalo = computed(() => intervaloDoPeriodo(periodo.value))
const chaveMes = computed(() => periodo.value.data.slice(0, 7))

// Ao abrir, busca de novo (a exportação sai atualizada); depois, só o que faltar
watch(
  () => `${intervalo.value.de}|${intervalo.value.ate}`,
  (_, antes) => store.garantirIntervalo(intervalo.value.de, intervalo.value.ate, { forcar: !antes }),
  { immediate: true },
)

/** Todos os eventos do período já chegaram (ano e meses distantes podem exigir nova consulta). */
const cobre = computed(() => store.cobre(intervalo.value.de, intervalo.value.ate))
const podeExportar = computed(() => cobre.value && !store.carregando && !store.erro)

const eventos = computed(() => eventosDoPeriodo(store.eventos, periodo.value))
/** No ano, uma faixa por mês; nos demais, um bloco só. */
const secoes = computed(() =>
  periodo.value.tipo === 'ano'
    ? agruparPorMes(eventos.value)
    : eventos.value.length
      ? [{ chave: 'periodo', nome: '', grupos: agruparPorData(eventos.value) }]
      : [],
)

const texto = computed(() =>
  textoWhatsAppAgenda(store.eventos, periodo.value, `${window.location.origin}/agenda?mes=${chaveMes.value}`),
)

const { copiar, abrirWhatsApp, imprimir, voltar } = useCompartilhar(texto, () => ({
  path: '/agenda',
  query: { mes: chaveMes.value },
}))

const trocarTipo = (tipo: unknown) => irPara({ tipo: tipo as TipoPeriodo, data: periodo.value.data })

/** Cores da tabela usada hoje (impressão sempre em fundo branco). */
const LINHA: Record<CorEvento, string> = { nenhuma: '', amarela: 'bg-[#ffff99]', verde: 'bg-[#92d050]' }
</script>

<template>
  <div class="min-h-dvh bg-muted print:bg-white">
    <!-- Barra de ações (não sai na impressão) -->
    <div class="sticky top-0 z-10 border-b bg-card/95 backdrop-blur print:hidden">
      <div class="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
        <Button variant="ghost" class="-ml-2 text-muted-foreground" @click="voltar"><PhArrowLeft /> Voltar</Button>
        <Tabs :model-value="periodo.tipo" class="max-w-full overflow-x-auto" @update:model-value="trocarTipo">
          <TabsList class="h-11!" aria-label="Período da exportação">
            <TabsTrigger v-for="t in TIPOS_PERIODO" :key="t.valor" :value="t.valor" class="px-3">{{ t.rotulo }}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div class="flex w-full items-center gap-1">
          <Button variant="ghost" size="icon-lg" aria-label="Período anterior" @click="irPara(somarPeriodo(periodo, -1))">
            <PhCaretLeft />
          </Button>
          <span class="min-w-0 flex-1 text-center font-semibold" aria-live="polite">{{ rotuloPeriodo(periodo) }}</span>
          <Button variant="ghost" size="icon-lg" aria-label="Próximo período" @click="irPara(somarPeriodo(periodo, 1))">
            <PhCaretRight />
          </Button>
          <Button variant="ghost" @click="irPara({ tipo: periodo.tipo, data: hoje })">Hoje</Button>
        </div>
        <div class="flex w-full flex-wrap gap-2">
          <Button variant="outline" size="lg" :disabled="!podeExportar" @click="copiar"><PhCopy /> Copiar texto</Button>
          <Button variant="outline" size="lg" :disabled="!podeExportar" @click="abrirWhatsApp">
            <PhWhatsappLogo /> WhatsApp
          </Button>
          <Button size="lg" :disabled="!podeExportar" @click="imprimir"><PhPrinter /> Imprimir / PDF</Button>
        </div>
      </div>
    </div>

    <div v-if="!cobre && !store.erro" class="flex justify-center py-16 text-primary print:hidden">
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
                {{ tituloPeriodo(periodo) }}
              </th>
            </tr>
          </thead>
          <tbody v-if="!secoes.length">
            <tr>
              <td colspan="3" class="border border-black px-2 py-4 text-center italic">Nenhum evento cadastrado neste período.</td>
            </tr>
          </tbody>
          <tbody v-for="m in secoes" :key="m.chave">
            <tr v-if="m.nome" class="break-after-avoid">
              <td colspan="3" class="border border-black bg-[#d9ead3] py-1 text-center font-bold">{{ m.nome }}</td>
            </tr>
            <template v-for="g in m.grupos" :key="g.data">
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
