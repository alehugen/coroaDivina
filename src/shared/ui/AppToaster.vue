<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/shared/composables/useTheme'

const { isDark } = useTheme()
</script>

<template>
  <Toaster :theme="isDark ? 'dark' : 'light'" position="top-center" close-button />
</template>
