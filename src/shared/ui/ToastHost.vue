<script setup lang="ts">
import { fecharToast, useToasts } from '@/shared/composables/useToast'

const toasts = useToasts()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
    aria-live="polite"
  >
    <TransitionGroup
      enter-from-class="translate-y-2 opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-150"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
        :class="{
          success: 'border-success/40 bg-surface text-text',
          danger: 'border-danger/40 bg-danger-soft text-danger',
          info: 'border-border bg-surface text-text',
        }[t.tom]"
        role="status"
      >
        <span
          class="mt-1 size-2 shrink-0 rounded-full"
          :class="{ success: 'bg-success', danger: 'bg-danger', info: 'bg-primary' }[t.tom]"
        />
        <p class="flex-1">{{ t.texto }}</p>
        <button
          type="button"
          class="text-muted hover:text-text"
          aria-label="Fechar"
          @click="fecharToast(t.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
