<script setup lang="ts">
import { parseISO } from 'date-fns'
import { onMounted, ref } from 'vue'
import { preenchimento, type DiaEscala } from '../../domain/Escala'

/**
 * Seletor de dias: anel de progresso em volta da data (enche conforme as vagas
 * são preenchidas) e ponto lima nos dias em que o usuário está escalado.
 */
defineProps<{ dias: DiaEscala[]; meuId?: string }>()
const selecionado = defineModel<string | null>({ required: true })

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const R = 15.9 // raio com circunferência ≈ 100 (pathLength=100)

// Anéis começam vazios e enchem no primeiro frame (animação de entrada)
const montado = ref(false)
onMounted(() => requestAnimationFrame(() => (montado.value = true)))

function info(d: DiaEscala, meuId?: string) {
  const p = preenchimento(d.funcoes)
  const data = parseISO(d.data)
  return {
    ...p,
    semana: SEMANA[data.getDay()],
    numero: data.getDate(),
    euDentro: !!meuId && d.funcoes.some((f) => f.ativa && f.inscricoes.some((i) => i.profileId === meuId)),
  }
}
</script>

<template>
  <nav
    class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    aria-label="Dias da escala"
  >
    <button
      v-for="d in dias"
      :key="d.id"
      type="button"
      class="flex w-17 shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-1 pt-2 pb-1.5 transition-colors"
      :class="selecionado === d.id ? 'border-primary bg-accent' : 'bg-card hover:border-primary/40'"
      :aria-current="selecionado === d.id ? 'page' : undefined"
      :aria-label="`${info(d, meuId).semana} ${info(d, meuId).numero}: ${info(d, meuId).ocupadas} de ${info(d, meuId).vagas} vagas preenchidas${info(d, meuId).euDentro ? ', você está escalado(a)' : ''}`"
      @click="selecionado = d.id"
    >
      <span class="text-xs font-semibold text-muted-foreground">{{ info(d, meuId).semana }}</span>
      <span class="relative grid size-10 place-items-center">
        <svg class="absolute inset-0 -rotate-90" viewBox="0 0 38 38" aria-hidden="true">
          <circle cx="19" cy="19" :r="R" fill="none" stroke-width="3.5" class="stroke-muted" />
          <circle
            cx="19"
            cy="19"
            :r="R"
            fill="none"
            stroke-width="3.5"
            stroke-linecap="round"
            pathLength="100"
            stroke-dasharray="100"
            :stroke-dashoffset="montado ? 100 - info(d, meuId).pct : 100"
            class="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
            :class="info(d, meuId).completo ? 'stroke-success' : 'stroke-primary'"
          />
        </svg>
        <span class="text-sm font-bold tabular-nums">{{ info(d, meuId).numero }}</span>
      </span>
      <span
        class="size-1.5 rounded-full"
        :class="info(d, meuId).euDentro ? 'bg-highlight' : 'bg-transparent'"
        aria-hidden="true"
      />
    </button>
    <slot />
  </nav>
</template>
