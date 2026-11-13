<script setup lang="ts">
import type { Component } from 'vue'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

/**
 * Estado vazio. Com `coroa`, mostra a coroa do logo traçada uma vez ao aparecer
 * (a única animação do app que não depende de toque).
 */
defineProps<{ titulo: string; descricao?: string; icone?: Component; coroa?: boolean }>()
</script>

<template>
  <Empty class="border bg-card">
    <EmptyHeader>
      <svg v-if="coroa" class="coroa mb-1 h-16 w-22" viewBox="0 0 92 70" aria-hidden="true">
        <path
          d="M14 50 22 16l16 20 8-26 8 26 16-20 8 34z"
          fill="none"
          stroke="var(--primary)"
          stroke-width="3"
          stroke-linejoin="round"
        />
        <path d="M16 60h60" fill="none" stroke="var(--highlight)" stroke-width="5" stroke-linecap="round" />
      </svg>
      <EmptyMedia v-else-if="icone" variant="icon">
        <component :is="icone" />
      </EmptyMedia>
      <EmptyTitle class="text-base">{{ titulo }}</EmptyTitle>
      <EmptyDescription v-if="descricao">{{ descricao }}</EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="$slots.default">
      <slot />
    </EmptyContent>
  </Empty>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .coroa path {
    stroke-dasharray: 260;
    stroke-dashoffset: 260;
    animation: coroa-desenhar 1.4s ease-out 0.15s forwards;
  }
}
@keyframes coroa-desenhar {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
