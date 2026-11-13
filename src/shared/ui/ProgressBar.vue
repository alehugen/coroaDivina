<script setup lang="ts">
defineProps<{ valor: number; rotulo: string }>()
</script>

<template>
  <div
    class="h-2 w-full overflow-hidden rounded-full bg-surface-2"
    role="progressbar"
    :aria-valuenow="valor"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="rotulo"
  >
    <div
      class="h-full rounded-full transition-[width]"
      :class="valor >= 100 ? 'bg-success' : 'bg-accent'"
      :style="{ width: `${valor}%` }"
    />
  </div>
</template>
