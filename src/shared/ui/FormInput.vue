<script setup lang="ts">
import { nextTick, useId } from 'vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// Atributos extras (inputmode, maxlength, @blur...) vão para o <input>.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  label: string
  type?: string
  placeholder?: string
  autocomplete?: string
  error?: string
  hint?: string
  required?: boolean
  /** Formata enquanto a pessoa digita (ex.: máscara de telefone). */
  mascara?: (valor: string) => string
}>()

const model = defineModel<string>({ default: '' })
const id = useId()

function atualizar(v: string | number, e?: Event) {
  const valor = props.mascara ? props.mascara(String(v)) : String(v)
  model.value = valor
  // Mantém o campo igual ao valor mascarado mesmo quando o model não muda
  const el = e?.target as HTMLInputElement | undefined
  if (el) nextTick(() => el.value !== valor && (el.value = valor))
}
</script>

<template>
  <Field :data-invalid="!!error || undefined">
    <FieldLabel :for="id">
      {{ label }}<span v-if="required" class="text-destructive">*</span>
    </FieldLabel>
    <Input
      v-bind="$attrs"
      :id="id"
      :model-value="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :aria-invalid="!!error || undefined"
      class="h-10"
      @input="atualizar(($event.target as HTMLInputElement).value, $event)"
    />
    <FieldError v-if="error">{{ error }}</FieldError>
    <FieldDescription v-else-if="hint">{{ hint }}</FieldDescription>
  </Field>
</template>
