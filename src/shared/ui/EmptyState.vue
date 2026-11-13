<script setup lang="ts">
defineProps<{ titulo: string; descricao?: string }>()
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center"
  >
    <h2 class="font-semibold text-text">{{ titulo }}</h2>
    <p v-if="descricao" class="max-w-md text-sm text-muted">{{ descricao }}</p>
    <slot />
  </div>
</template>
