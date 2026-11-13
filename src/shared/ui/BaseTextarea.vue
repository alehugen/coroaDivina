<script setup lang="ts">
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })
defineProps<{ label: string; placeholder?: string; rows?: number; hint?: string }>()
const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-text">{{ label }}</label>
    <textarea
      v-bind="$attrs"
      :id="id"
      v-model="model"
      :rows="rows ?? 3"
      :placeholder="placeholder"
      class="rounded-lg border border-border bg-surface px-3 py-2 text-text placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
    />
    <p v-if="hint" class="text-sm text-muted">{{ hint }}</p>
  </div>
</template>
