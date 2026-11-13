<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

defineProps<{ titulo: string; descricao?: string }>()
const aberto = defineModel<boolean>({ required: true })
const dialog = ref<HTMLDialogElement>()

watch(
  aberto,
  async (v) => {
    await nextTick()
    if (v && !dialog.value?.open) dialog.value?.showModal()
    if (!v && dialog.value?.open) dialog.value.close()
  },
  { immediate: true },
)
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-surface p-0 text-text shadow-xl backdrop:bg-black/50"
    @close="aberto = false"
  >
    <div v-if="aberto" class="flex flex-col gap-5 p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">{{ titulo }}</h2>
          <p v-if="descricao" class="mt-1 text-sm text-muted">{{ descricao }}</p>
        </div>
        <button
          type="button"
          class="-m-1 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-text"
          aria-label="Fechar"
          @click="aberto = false"
        >
          ✕
        </button>
      </div>
      <slot />
      <div v-if="$slots.rodape" class="flex flex-wrap justify-end gap-2">
        <slot name="rodape" />
      </div>
    </div>
  </dialog>
</template>
