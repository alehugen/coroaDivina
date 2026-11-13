<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  opcoes: { value: string; label: string }[]
  placeholder?: string
  error?: string
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
    <select
      :id="id"
      v-model="model"
      :required="required"
      :aria-invalid="!!error"
      class="h-11 rounded-lg border bg-surface px-3 text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      :class="error ? 'border-danger' : 'border-border'"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="o in opcoes" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
  </div>
</template>
