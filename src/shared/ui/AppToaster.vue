<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/shared/composables/useTheme'

const { isDark } = useTheme()

// Ícone verde no sucesso e vermelho no erro, com as cores do app
const toastOptions = {
  classes: {
    toast: 'rounded-2xl text-[0.95rem]',
    success: '[&_[data-icon]]:text-primary',
    error: '[&_[data-icon]]:text-destructive',
  },
}
</script>

<template>
  <Toaster :theme="isDark ? 'dark' : 'light'" position="top-center" close-button :toast-options="toastOptions" />
</template>
