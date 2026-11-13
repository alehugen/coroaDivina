<script setup lang="ts">
/** Campo numérico compacto com botões −/+ (bom para toque no celular). */
const props = withDefaults(defineProps<{ rotulo: string; min?: number; max?: number; disabled?: boolean }>(), {
  min: 0,
  max: 99,
})
const model = defineModel<number>({ required: true })

function definir(v: number) {
  const n = Math.max(props.min, Math.min(props.max, Number.isFinite(v) ? Math.round(v) : props.min))
  if (n !== model.value) model.value = n
}
</script>

<template>
  <div class="inline-flex h-9 items-stretch overflow-hidden rounded-lg border border-border bg-surface">
    <button
      type="button"
      class="w-8 text-muted hover:bg-surface-2 hover:text-text disabled:opacity-40"
      :aria-label="`Diminuir ${rotulo}`"
      :disabled="disabled || model <= min"
      @click="definir(model - 1)"
    >
      −
    </button>
    <input
      type="number"
      inputmode="numeric"
      :min="min"
      :max="max"
      :value="model"
      :aria-label="rotulo"
      :disabled="disabled"
      class="w-10 border-x border-border bg-surface text-center text-sm text-text [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
      @change="definir(Number(($event.target as HTMLInputElement).value))"
    />
    <button
      type="button"
      class="w-8 text-muted hover:bg-surface-2 hover:text-text disabled:opacity-40"
      :aria-label="`Aumentar ${rotulo}`"
      :disabled="disabled || model >= max"
      @click="definir(model + 1)"
    >
      +
    </button>
  </div>
</template>
