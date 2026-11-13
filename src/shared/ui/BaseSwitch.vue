<script setup lang="ts">
defineProps<{ rotulo: string; disabled?: boolean; mostrarRotulo?: boolean }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2" :class="disabled && 'cursor-not-allowed opacity-50'">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-label="mostrarRotulo ? undefined : rotulo"
      :disabled="disabled"
      class="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors"
      :class="model ? 'bg-primary' : 'bg-border'"
      @click="model = !model"
    >
      <span
        class="inline-block size-4 rounded-full bg-white shadow transition-transform"
        :class="model ? 'translate-x-5' : 'translate-x-1'"
      />
    </button>
    <span v-if="mostrarRotulo" class="text-sm text-text">{{ rotulo }}</span>
  </label>
</template>
