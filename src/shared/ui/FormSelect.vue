<script setup lang="ts">
import { useId } from 'vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

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
  <Field :data-invalid="!!error || undefined">
    <FieldLabel :for="id">
      {{ label }}<span v-if="required" class="text-destructive">*</span>
    </FieldLabel>
    <!-- NativeSelect: melhor experiência no celular (abre o seletor do sistema) -->
    <NativeSelect
      :id="id"
      v-model="model"
      class="w-full [&_select]:h-10"
      :required="required"
      :aria-invalid="!!error || undefined"
    >
      <NativeSelectOption v-if="placeholder" value="" disabled>{{ placeholder }}</NativeSelectOption>
      <NativeSelectOption v-for="o in opcoes" :key="o.value" :value="o.value">{{ o.label }}</NativeSelectOption>
    </NativeSelect>
    <FieldError v-if="error">{{ error }}</FieldError>
  </Field>
</template>
