<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Esqueleto com a forma do conteúdo, no lugar da rodinha de carregando.
 * - cards: grade de cartões (listas de escalas)
 * - lista: linhas com avatar (sócios, mandatos, minhas escalas)
 * - grade: dias + funções (grade da escala / editor)
 */
withDefaults(defineProps<{ forma?: 'cards' | 'lista' | 'grade'; quantidade?: number }>(), {
  forma: 'cards',
  quantidade: 3,
})
</script>

<template>
  <div role="status" aria-live="polite" aria-label="Carregando">
    <div v-if="forma === 'cards'" class="grid gap-3 md:grid-cols-2">
      <div v-for="k in quantidade" :key="k" class="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <Skeleton class="h-5 w-3/5" />
        <Skeleton class="h-4 w-2/5" />
        <Skeleton class="h-2 w-full" />
        <Skeleton class="h-10 w-44" />
      </div>
    </div>

    <div v-else-if="forma === 'lista'" class="divide-y overflow-hidden rounded-xl border bg-card">
      <div v-for="k in quantidade" :key="k" class="flex items-center gap-3 px-4 py-4">
        <Skeleton class="size-10 shrink-0 rounded-full" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-3 w-1/3" />
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-5">
      <Skeleton class="h-7 w-2/3 max-w-sm" />
      <div class="flex gap-2">
        <Skeleton v-for="k in 4" :key="k" class="h-20 w-17 shrink-0 rounded-2xl" />
      </div>
      <div class="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <Skeleton class="h-5 w-40" />
        <div class="flex gap-2">
          <Skeleton v-for="k in 5" :key="k" class="size-11 rounded-full" />
        </div>
        <Skeleton class="h-5 w-32" />
        <div class="flex gap-2">
          <Skeleton v-for="k in 3" :key="k" class="size-11 rounded-full" />
        </div>
      </div>
    </div>
    <span class="sr-only">Carregando…</span>
  </div>
</template>
