<script setup lang="ts">
import { PhArrowRight, PhStar } from '@phosphor-icons/vue'
import { computed } from 'vue'
import type { DataISO } from '@/shared/lib/datas'
import { ROTULO_PAPEL, rotuloQuando, type MinhaInscricao } from '../../domain/Inscricao'

/**
 * O compromisso mais próximo do sócio, em destaque: data grande, "quando" em
 * linguagem simples e as funções do dia. Único uso do par verde-escuro + amarelo.
 */
const props = defineProps<{ data: DataISO; itens: MinhaInscricao[]; hoje: DataISO }>()

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const dia = computed(() => Number(props.data.slice(8, 10)))
const mes = computed(() => MESES[Number(props.data.slice(5, 7)) - 1])
const escalas = computed(() => [...new Set(props.itens.map((i) => i.escala))])
const destino = computed(() => ({ path: `/escalas/${props.itens[0]!.escalaId}`, query: { dia: props.data } }))
</script>

<template>
  <RouterLink
    :to="destino"
    class="relative grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 overflow-hidden rounded-2xl bg-brand-900 p-4 text-white shadow-sm outline-offset-4 transition-transform active:scale-[0.99] motion-reduce:transition-none sm:p-5"
    :aria-label="`Próximo compromisso: ${rotuloQuando(data, hoje)}. Abrir a escala`"
  >
    <span class="row-span-2 flex w-16 flex-col items-center justify-center rounded-xl bg-white/12 py-1.5">
      <span class="text-3xl leading-none font-extrabold tabular-nums">{{ dia }}</span>
      <span class="text-xs opacity-85">{{ mes }}</span>
    </span>
    <span class="self-end text-sm font-semibold text-brand-50">{{ rotuloQuando(data, hoje) }}</span>
    <span class="self-start text-lg leading-snug font-semibold">{{ escalas.join(' e ') }}</span>

    <ul class="col-span-2 mt-2 grid gap-1.5 border-t border-white/20 pt-3 text-[0.95rem]">
      <li v-for="i in itens" :key="i.id" class="flex items-center justify-between gap-3">
        <strong class="font-semibold">{{ i.funcao }}</strong>
        <span class="inline-flex items-center gap-1 opacity-85">
          <PhStar v-if="i.papel === 'responsavel'" weight="fill" class="size-3.5 text-brand-50" />
          {{ ROTULO_PAPEL[i.papel] }}
        </span>
      </li>
    </ul>
    <span class="col-span-2 mt-2 inline-flex items-center gap-1 text-sm font-medium opacity-90">
      Ver a equipe <PhArrowRight class="size-4" />
    </span>

    <!-- coroa da marca, discreta ao fundo -->
    <svg class="pointer-events-none absolute -right-4 -bottom-5 w-28 opacity-15" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 21 10.5 11l4 5 1.5-7 1.5 7 4-5L24 21z" fill="#ffff3f" />
      <rect x="8" y="22.5" width="16" height="2.5" rx="1" fill="#aacc00" />
    </svg>
  </RouterLink>
</template>
