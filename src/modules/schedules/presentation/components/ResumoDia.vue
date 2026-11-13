<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { funcoesPorArea, preenchimento, rotuloDia, type DiaEscala } from '../../domain/Escala'

/** Título do dia + barras de preenchimento por área (crescem ao aparecer). */
const props = defineProps<{ dia: DiaEscala }>()

const total = computed(() => preenchimento(props.dia.funcoes))
const areas = computed(() =>
  funcoesPorArea(props.dia.funcoes.filter((f) => f.ativa)).map((g) => ({ ...g.area, ...preenchimento(g.funcoes) })),
)

// Começa em 0 e cresce no primeiro frame (animação de entrada)
const montado = ref(false)
onMounted(() => requestAnimationFrame(() => (montado.value = true)))
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3">
      <h2 class="text-lg font-semibold">{{ rotuloDia(dia.data) }}</h2>
      <p class="text-sm text-muted-foreground tabular-nums">
        <template v-if="total.completo">Dia completo</template>
        <template v-else>{{ total.ocupadas }} de {{ total.vagas }} vagas preenchidas</template>
      </p>
    </div>
    <div v-if="areas.length > 1 || total.vagas" class="grid gap-2 sm:grid-cols-2">
      <div v-for="a in areas" :key="a.id" class="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 text-sm">
        <span class="truncate">{{ a.nome }}</span>
        <span class="text-muted-foreground tabular-nums">{{ a.ocupadas }}/{{ a.vagas }}</span>
        <span class="col-span-2 h-2 overflow-hidden rounded-full bg-muted">
          <span
            class="block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
            :style="{ width: `${montado ? a.pct : 0}%`, backgroundColor: a.cor }"
          />
        </span>
      </div>
    </div>
  </div>
</template>
