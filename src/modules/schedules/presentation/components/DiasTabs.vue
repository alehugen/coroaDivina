<script setup lang="ts">
import { PhCheckCircle } from '@phosphor-icons/vue'
import { ocupacao, rotuloDiaCurto, type DiaEscala } from '../../domain/Escala'

/** Seletor horizontal de dias da escala, com o preenchimento de cada dia. */
defineProps<{ dias: DiaEscala[]; meuId?: string }>()
const selecionado = defineModel<string | null>({ required: true })

function resumo(d: DiaEscala, meuId?: string) {
  const ativas = d.funcoes.filter((f) => f.ativa)
  const os = ativas.map(ocupacao)
  const vagas = os.reduce((n, o) => n + o.vagas, 0)
  const ocupadas = os.reduce((n, o) => n + o.total, 0)
  const euDentro = !!meuId && ativas.some((f) => f.inscricoes.some((i) => i.profileId === meuId))
  return { vagas, ocupadas, completo: vagas > 0 && ocupadas >= vagas, euDentro }
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
      class="relative flex min-w-20 shrink-0 flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors"
      :class="selecionado === d.id ? 'border-primary bg-accent' : 'bg-card hover:border-primary/40'"
      :aria-current="selecionado === d.id ? 'page' : undefined"
      @click="selecionado = d.id"
    >
      <span class="text-sm font-semibold">{{ rotuloDiaCurto(d.data) }}</span>
      <span
        class="text-xs tabular-nums"
        :class="resumo(d, meuId).completo ? 'font-medium text-success' : 'text-muted-foreground'"
      >
        {{ resumo(d, meuId).ocupadas }}/{{ resumo(d, meuId).vagas }}
      </span>
      <PhCheckCircle
        v-if="resumo(d, meuId).euDentro"
        weight="fill"
        class="absolute top-1.5 right-1.5 size-4 text-primary"
        aria-label="Você está escalado(a) neste dia"
      />
    </button>
    <slot />
  </nav>
</template>
