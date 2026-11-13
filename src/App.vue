<script setup lang="ts">
import { Spinner } from '@/components/ui/spinner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useSessionStore } from '@/modules/identity'
import { AppToaster, ConfirmDialogHost } from '@/shared/ui'

const session = useSessionStore()
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div v-if="!session.carregado" class="flex min-h-dvh items-center justify-center text-primary">
      <Spinner class="size-8" />
    </div>
    <RouterView v-else />
    <AppToaster />
    <ConfirmDialogHost />
  </TooltipProvider>
</template>
