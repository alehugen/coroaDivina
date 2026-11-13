<script setup lang="ts">
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'

/** Campo numérico com −/+ (NumberField do shadcn), bom para toque no celular. */
withDefaults(defineProps<{ rotulo: string; min?: number; max?: number; disabled?: boolean }>(), {
  min: 0,
  max: 99,
})
const model = defineModel<number>({ required: true })
</script>

<template>
  <NumberField
    v-model="model"
    :min="min"
    :max="max"
    :disabled="disabled"
    :step="1"
    :aria-label="rotulo"
    class="w-28"
  >
    <NumberFieldContent>
      <NumberFieldDecrement :aria-label="`Diminuir ${rotulo}`" />
      <NumberFieldInput class="h-9" />
      <NumberFieldIncrement :aria-label="`Aumentar ${rotulo}`" />
    </NumberFieldContent>
  </NumberField>
</template>
