<script setup lang="ts">
import { PhArrowRight, PhCaretLeft, PhCaretRight, PhCheckCircle } from '@phosphor-icons/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import type { DataISO } from '@/shared/lib/datas'
import {
  DIAS_SEMANA,
  mesDe,
  rotuloMes,
  semanasDoMes,
  somarMes,
  type EventoDia,
} from '../../domain/Calendario'
import { rotuloDia, STATUS_INFO, type StatusEscala } from '../../domain/Escala'

const props = defineProps<{ eventos: Map<DataISO, EventoDia[]>; hoje: DataISO }>()

const mes = ref(mesDe(props.hoje))
const selecionado = ref<DataISO | null>(null)

// Ao abrir, se não houver nada neste mês, pula para o próximo mês com escala
watch(
  () => props.eventos,
  (ev) => {
    const prefixo = props.hoje.slice(0, 7)
    const datas = [...ev.keys()].filter((d) => d >= props.hoje).sort()
    if (datas.length && !datas.some((d) => d.startsWith(prefixo))) mes.value = mesDe(datas[0]!)
  },
  { immediate: true },
)

const semanas = computed(() => semanasDoMes(mes.value.ano, mes.value.mes, props.hoje))
const eventosSelecionados = computed(() => (selecionado.value ? (props.eventos.get(selecionado.value) ?? []) : []))

const COR_STATUS: Record<StatusEscala, string> = {
  aberta: 'bg-primary text-primary-foreground',
  rascunho: 'bg-muted text-muted-foreground',
  fechada: 'bg-warning-soft text-warning',
  arquivada: 'bg-muted text-muted-foreground line-through',
}

function navegar(n: number) {
  mes.value = somarMes(mes.value, n)
  selecionado.value = null
}

function irParaHoje() {
  mes.value = mesDe(props.hoje)
  selecionado.value = props.hoje
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="overflow-hidden rounded-xl border bg-card">
      <!-- Navegação -->
      <div class="flex items-center gap-2 border-b px-3 py-2">
        <Button variant="ghost" size="icon-lg" aria-label="Mês anterior" @click="navegar(-1)"><PhCaretLeft /></Button>
        <h2 class="flex-1 text-center font-semibold" aria-live="polite">{{ rotuloMes(mes.ano, mes.mes) }}</h2>
        <Button variant="ghost" size="icon-lg" aria-label="Próximo mês" @click="navegar(1)"><PhCaretRight /></Button>
        <Button variant="outline" @click="irParaHoje">Hoje</Button>
      </div>

      <!-- Grade -->
      <div class="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
        <span v-for="d in DIAS_SEMANA" :key="d" class="py-1.5">{{ d }}</span>
      </div>
      <div class="grid grid-cols-7">
        <template v-for="semana in semanas" :key="semana[0]!.data">
          <button
            v-for="d in semana"
            :key="d.data"
            type="button"
            class="relative flex min-h-14 flex-col items-stretch gap-1 border-b border-r p-1 text-left transition-colors last:border-r-0 hover:bg-muted/60 sm:min-h-24 [&:nth-child(7n)]:border-r-0"
            :class="[!d.noMes && 'bg-muted/30 text-muted-foreground', selecionado === d.data && 'bg-accent!']"
            :aria-label="`${rotuloDia(d.data)}${eventos.get(d.data)?.length ? `, ${eventos.get(d.data)!.length} escala(s)` : ''}`"
            :aria-pressed="selecionado === d.data"
            @click="selecionado = d.data"
          >
            <span
              class="inline-flex size-6 items-center justify-center self-start rounded-full text-xs font-medium tabular-nums"
              :class="d.hoje && 'bg-primary text-primary-foreground'"
            >
              {{ d.numero }}
            </span>
            <!-- celular: só bolinhas -->
            <span v-if="eventos.get(d.data)" class="flex flex-wrap gap-0.5 sm:hidden">
              <span
                v-for="e in eventos.get(d.data)"
                :key="e.escalaId"
                class="size-2 rounded-full"
                :class="e.souEscalado ? 'bg-highlight ring-1 ring-primary' : e.status === 'aberta' ? 'bg-primary' : 'bg-muted-foreground/50'"
              />
            </span>
            <!-- telas maiores: nome da escala -->
            <span
              v-for="e in eventos.get(d.data) ?? []"
              :key="e.escalaId"
              class="hidden items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight sm:flex"
              :class="COR_STATUS[e.status]"
            >
              <PhCheckCircle v-if="e.souEscalado" weight="fill" class="size-3 shrink-0" />
              <span class="truncate">{{ e.titulo }}</span>
            </span>
          </button>
        </template>
      </div>
    </div>

    <!-- Legenda -->
    <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-primary" /> Inscrições abertas</span>
      <span class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-muted-foreground/50" /> Outras</span>
      <span class="inline-flex items-center gap-1.5">
        <PhCheckCircle weight="fill" class="size-3.5 text-primary" /> Você está escalado(a)
      </span>
    </p>

    <!-- Dia selecionado -->
    <section v-if="selecionado" class="rounded-xl border bg-card">
      <h3 class="border-b px-4 py-2.5 font-semibold">{{ rotuloDia(selecionado) }}</h3>
      <p v-if="!eventosSelecionados.length" class="px-4 py-4 text-sm text-muted-foreground">Nenhuma escala neste dia.</p>
      <ul v-else class="divide-y">
        <li v-for="e in eventosSelecionados" :key="e.escalaId">
          <RouterLink
            :to="{ path: `/escalas/${e.escalaId}`, query: { dia: selecionado } }"
            class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium">{{ e.titulo }}</span>
              <span class="block text-xs text-muted-foreground">
                {{ STATUS_INFO[e.status].rotulo }}
                <template v-if="e.souEscalado"> · você está escalado(a)</template>
              </span>
            </span>
            <PhCheckCircle v-if="e.souEscalado" weight="fill" class="size-5 text-primary" />
            <PhArrowRight class="size-4 text-muted-foreground" />
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>
