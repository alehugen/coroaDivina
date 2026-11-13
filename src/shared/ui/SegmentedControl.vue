<script setup lang="ts" generic="T extends string">
defineProps<{ opcoes: { value: T; label: string; contador?: number }[]; rotulo: string }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    role="tablist"
    :aria-label="rotulo"
    class="inline-flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-2 p-1"
  >
    <button
      v-for="o in opcoes"
      :key="o.value"
      type="button"
      role="tab"
      :aria-selected="model === o.value"
      class="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      :class="model === o.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'"
      @click="model = o.value"
    >
      {{ o.label }}
      <span
        v-if="o.contador !== undefined"
        class="rounded-full px-1.5 text-xs"
        :class="model === o.value ? 'bg-primary-soft text-primary' : 'bg-surface text-muted'"
      >
        {{ o.contador }}
      </span>
    </button>
  </div>
</template>
