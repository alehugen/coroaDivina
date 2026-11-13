<script setup lang="ts">
/** Botão pequeno só com ícone/símbolo. `rotulo` vira aria-label e title. */
defineProps<{ rotulo: string; disabled?: boolean; perigo?: boolean }>()
</script>

<template>
  <button
    type="button"
    class="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-30"
    :class="perigo ? 'hover:text-danger' : 'hover:text-text'"
    :aria-label="rotulo"
    :title="rotulo"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
