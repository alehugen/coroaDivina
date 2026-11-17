<script setup lang="ts">
import { computed } from 'vue'
import { DIAS_SEMANA, semanasDoMes } from '@/shared/lib/calendario'
import { formatarData, type DataISO } from '@/shared/lib/datas'
import type { CorEvento, Evento } from '../../domain/Evento'

/** Mês inteiro em grade. No celular, cada evento vira uma faixa colorida; em telas maiores, o título. */
const props = defineProps<{
  ano: number
  mes: number
  hoje: DataISO
  eventos: Map<DataISO, Evento[]>
  selecionado: DataISO | null
}>()
const emit = defineEmits<{ escolher: [data: DataISO] }>()

const semanas = computed(() => semanasDoMes(props.ano, props.mes, props.hoje))

const CHIP: Record<CorEvento, string> = {
  nenhuma: 'bg-muted text-foreground',
  amarela: 'evento-amarelo',
  verde: 'evento-verde',
}
const FAIXA: Record<CorEvento, string> = {
  nenhuma: 'bg-muted-foreground/60',
  amarela: 'bg-[#e6c200]',
  verde: 'bg-success',
}

function rotuloAcessivel(data: DataISO) {
  const n = props.eventos.get(data)?.length ?? 0
  return `${formatarData(data, "EEEE, d 'de' MMMM")}${n ? `, ${n} ${n === 1 ? 'evento' : 'eventos'}` : ''}`
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border bg-card">
    <div class="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
      <span v-for="d in DIAS_SEMANA" :key="d" class="py-2">{{ d }}</span>
    </div>
    <div class="grid grid-cols-7">
      <template v-for="semana in semanas" :key="semana[0]!.data">
        <button
          v-for="d in semana"
          :key="d.data"
          type="button"
          class="flex min-h-16 min-w-0 flex-col items-stretch gap-1 border-r border-b p-1 text-left transition-colors hover:bg-muted/60 sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0"
          :class="[!d.noMes && 'bg-muted/30 text-muted-foreground/70', selecionado === d.data && 'bg-accent! ring-2 ring-primary ring-inset']"
          :aria-label="rotuloAcessivel(d.data)"
          :aria-pressed="selecionado === d.data"
          @click="emit('escolher', d.data)"
        >
          <span
            class="inline-flex size-7 items-center justify-center self-start rounded-full text-sm font-medium tabular-nums"
            :class="d.hoje && 'bg-primary text-primary-foreground'"
          >
            {{ d.numero }}
          </span>
          <!-- celular: faixas -->
          <span v-if="eventos.get(d.data)" class="flex flex-col gap-0.5 sm:hidden" aria-hidden="true">
            <span v-for="e in eventos.get(d.data)!.slice(0, 3)" :key="e.id" class="h-1.5 rounded-full" :class="FAIXA[e.cor]" />
          </span>
          <!-- telas maiores: títulos -->
          <span
            v-for="e in eventos.get(d.data) ?? []"
            :key="e.id"
            class="hidden truncate rounded px-1.5 py-0.5 text-xs leading-tight sm:block"
            :class="CHIP[e.cor]"
            :title="e.titulo"
          >
            <span v-if="e.hora" class="font-semibold tabular-nums">{{ e.hora }} </span>{{ e.titulo }}
          </span>
        </button>
      </template>
    </div>
  </div>
</template>
