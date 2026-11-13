<script setup lang="ts">
import { useId } from 'vue'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

defineOptions({ inheritAttrs: false })
defineProps<{ label: string; placeholder?: string; rows?: number; hint?: string }>()
const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <Field>
    <FieldLabel :for="id">{{ label }}</FieldLabel>
    <Textarea v-bind="$attrs" :id="id" v-model="model" :rows="rows ?? 3" :placeholder="placeholder" />
    <FieldDescription v-if="hint">{{ hint }}</FieldDescription>
  </Field>
</template>
