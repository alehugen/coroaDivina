<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { responderConfirmacao, useConfirmPendente } from '@/shared/composables/useConfirm'
import BaseButton from './BaseButton.vue'

const pendente = useConfirmPendente()
const dialog = ref<HTMLDialogElement>()

watch(pendente, async (p) => {
  await nextTick()
  if (p && !dialog.value?.open) dialog.value?.showModal()
  if (!p && dialog.value?.open) dialog.value.close()
})

function responder(ok: boolean) {
  responderConfirmacao(ok)
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-surface p-0 text-text shadow-xl backdrop:bg-black/50"
    @cancel.prevent="responder(false)"
  >
    <div v-if="pendente" class="flex flex-col gap-4 p-6">
      <h2 class="text-lg font-semibold">{{ pendente.titulo }}</h2>
      <p v-if="pendente.mensagem" class="text-sm text-muted">{{ pendente.mensagem }}</p>
      <div class="flex justify-end gap-2">
        <BaseButton variant="secondary" @click="responder(false)">
          {{ pendente.cancelar ?? 'Cancelar' }}
        </BaseButton>
        <BaseButton
          :variant="pendente.tom === 'danger' ? 'danger' : 'primary'"
          autofocus
          @click="responder(true)"
        >
          {{ pendente.confirmar ?? 'Confirmar' }}
        </BaseButton>
      </div>
    </div>
  </dialog>
</template>
