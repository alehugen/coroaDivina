<script setup lang="ts">
import { useSessionStore } from '@/modules/identity'
import { BaseSpinner } from '@/shared/ui'

const session = useSessionStore()
</script>

<template>
  <div v-if="!session.carregado" class="flex min-h-dvh items-center justify-center text-primary">
    <BaseSpinner class="size-8" />
  </div>
  <RouterView v-else />
</template>
