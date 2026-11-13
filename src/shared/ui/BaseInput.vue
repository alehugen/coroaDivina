<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  type?: string
  placeholder?: string
  autocomplete?: string
  error?: string
  hint?: string
  required?: boolean
}>()

const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-text">
      {{ label }}<span v-if="required" class="text-danger"> *</span>
    </label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :aria-invalid="!!error"
      :aria-describedby="error || hint ? `${id}-msg` : undefined"
      class="h-11 rounded-lg border bg-surface px-3 text-text placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      :class="error ? 'border-danger' : 'border-border'"
    />
    <p v-if="error" :id="`${id}-msg`" class="text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-msg`" class="text-sm text-muted">{{ hint }}</p>
  </div>
</template>
