<script setup lang="ts">
import { PhArrowLeft, PhCopy, PhPrinter, PhWarningCircle, PhWhatsappLogo } from '@phosphor-icons/vue'
import { computed, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Spinner } from '@/components/ui/spinner'
import { useCompartilhar } from '@/shared/composables/useCompartilhar'
import { funcoesPorArea, rotuloDia } from '../../domain/Escala'
import { linhasDaFuncao, textoWhatsApp } from '../../domain/Exportacao'
import { useEscalaAtualStore } from '../stores/escalaAtual'

const props = defineProps<{ id: string }>()
const store = useEscalaAtualStore()

watch(
  () => props.id,
  (id) => store.carregar(id),
  { immediate: true },
)

const TODOS = 'todos'
const filtroDia = ref(TODOS)
const dias = computed(() => store.escala?.dias ?? [])
const diasVisiveis = computed(() =>
  filtroDia.value === TODOS ? dias.value : dias.value.filter((d) => d.id === filtroDia.value),
)

const texto = computed(() =>
  store.escala
    ? textoWhatsApp(store.escala, {
        diaIds: diasVisiveis.value.map((d) => d.id),
        orgas: store.orgas,
        link: `${window.location.origin}/escalas/${store.escala.id}`,
      })
    : '',
)

const { copiar, abrirWhatsApp, imprimir, voltar } = useCompartilhar(texto, () => `/escalas/${props.id}`)

/** Faixa da área num tom claro da cor da área (como na planilha). */
const faixaArea = (cor: string) => ({ backgroundColor: `${cor}66` })
</script>

<template>
  <div class="min-h-dvh bg-muted print:bg-white">
    <!-- Barra de ações (não sai na impressão) -->
    <div class="sticky top-0 z-10 border-b bg-card/95 backdrop-blur print:hidden">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Button variant="ghost" class="-ml-2 text-muted-foreground" @click="voltar"><PhArrowLeft /> Voltar</Button>
        <NativeSelect v-model="filtroDia" aria-label="Dias para imprimir" class="[&_select]:h-9">
          <NativeSelectOption :value="TODOS">Todos os dias</NativeSelectOption>
          <NativeSelectOption v-for="d in dias" :key="d.id" :value="d.id">{{ rotuloDia(d.data) }}</NativeSelectOption>
        </NativeSelect>
        <div class="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="lg" :disabled="!store.escala" @click="copiar"><PhCopy /> Copiar texto</Button>
          <Button variant="outline" size="lg" :disabled="!store.escala" @click="abrirWhatsApp">
            <PhWhatsappLogo /> WhatsApp
          </Button>
          <Button size="lg" :disabled="!store.escala" @click="imprimir">
            <PhPrinter /> Imprimir / PDF
          </Button>
        </div>
      </div>
    </div>

    <div v-if="store.carregando && !store.escala" class="flex justify-center py-16 text-primary print:hidden">
      <Spinner class="size-6" />
    </div>

    <div v-else-if="store.erro && !store.escala" class="mx-auto max-w-xl p-6">
      <Alert variant="destructive">
        <PhWarningCircle />
        <AlertDescription>{{ store.erro }}</AlertDescription>
      </Alert>
    </div>

    <!-- Folhas (A4 paisagem, um dia por página) -->
    <div v-else-if="store.escala" class="overflow-x-auto py-6 print:overflow-visible print:py-0">
      <section
        v-for="d in diasVisiveis"
        :key="d.id"
        class="folha mx-auto mb-6 flex w-[285mm] flex-col bg-white p-[6mm] text-[8.5pt] leading-tight text-black shadow-md print:mb-0 print:w-auto print:p-0 print:shadow-none"
      >
        <!-- Título -->
        <header class="flex items-center justify-between gap-4 bg-[#0b4d2c] px-3 py-1.5 text-white">
          <span class="w-1/4" />
          <h1 class="flex-1 text-center text-[13pt] font-bold">{{ store.escala.titulo }}</h1>
          <span class="w-1/4 text-right text-[7.5pt] font-semibold italic">
            <template v-if="store.orgas">Orgã(s): {{ store.orgas }}</template>
          </span>
        </header>

        <!-- Dia -->
        <h2 class="mt-1.5 bg-[#00a651] py-1 text-center text-[10pt] font-bold text-white">{{ rotuloDia(d.data) }}</h2>

        <!-- Áreas -->
        <div v-for="g in funcoesPorArea(d.funcoes)" :key="g.area.id" class="mt-1.5">
          <h3 class="py-0.5 text-center font-bold" :style="faixaArea(g.area.cor)">{{ g.area.nome }}</h3>
          <div class="grid grid-cols-5 gap-px bg-neutral-300 p-px">
            <div v-for="f in g.funcoes" :key="f.id" class="bloco bg-white" :class="!f.ativa && 'text-neutral-400'">
              <p class="bg-[#d9d9d9] px-1 py-0.5 text-center font-bold italic" :class="!f.ativa && 'bg-neutral-100'">
                {{ f.nome }}
              </p>
              <ol>
                <li
                  v-for="l in f.ativa ? linhasDaFuncao(f) : []"
                  :key="l.numero"
                  class="flex h-[4.6mm] items-center border-t border-neutral-200"
                >
                  <span class="w-5 shrink-0 border-r border-neutral-200 text-center text-neutral-500">{{ l.numero }}</span>
                  <span class="truncate px-1" :class="l.papel === 'responsavel' && 'font-semibold'">
                    <template v-if="l.papel === 'responsavel'">★ </template>{{ l.nome ?? '' }}
                  </span>
                </li>
                <li v-if="!f.ativa" class="border-t border-neutral-200 py-0.5 text-center italic">não haverá</li>
              </ol>
            </div>
          </div>
        </div>

        <!-- Observações -->
        <div class="mt-1.5 border border-neutral-300">
          <p class="bg-[#595959] py-0.5 text-center font-bold italic text-white">Observações:</p>
          <p class="min-h-[12mm] px-2 py-1 whitespace-pre-line">{{ d.observacoes }}</p>
        </div>

        <p class="mt-1 text-right text-[7pt] text-neutral-500">★ = Responsável</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.folha {
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
.folha:not(:last-child) {
  break-after: page;
}
.bloco {
  break-inside: avoid;
}
</style>
