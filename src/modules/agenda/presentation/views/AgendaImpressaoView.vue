<script setup lang="ts">
import { PhArrowLeft, PhCaretLeft, PhCaretRight, PhCopy, PhPrinter, PhWarningCircle, PhWhatsappLogo } from '@phosphor-icons/vue'
import { computed, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCompartilhar } from '@/shared/composables/useCompartilhar'
import { rotuloMes, somarMes } from '@/shared/lib/calendario'
import { formatarData } from '@/shared/lib/datas'
import { agruparPorData, eventosDoMes, rotuloSemana, textoWhatsAppAgenda, type CorEvento } from '../../domain/Evento'
import { useMesDaQuery } from '../composables/useMesDaQuery'
import { useAgendaStore } from '../stores/agenda'

const store = useAgendaStore()
const { mes, chave: chaveMes, irPara } = useMesDaQuery()
watch(chaveMes, (c) => store.garantirMes(c), { immediate: true })

const grupos = computed(() => agruparPorData(eventosDoMes(store.eventos, mes.value.ano, mes.value.mes)))
const nomeMes = computed(() => rotuloMes(mes.value.ano, mes.value.mes).split(' de ')[0]!.toUpperCase())

const texto = computed(() =>
  textoWhatsAppAgenda(store.eventos, mes.value.ano, mes.value.mes, `${window.location.origin}/agenda?mes=${chaveMes.value}`),
)

const { copiar, abrirWhatsApp, imprimir, voltar } = useCompartilhar(texto, () => ({
  path: '/agenda',
  query: { mes: chaveMes.value },
}))

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
