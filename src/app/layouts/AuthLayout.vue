<script setup lang="ts">
import { AppLogo, BaseCard, ThemeToggle } from '@/shared/ui'

defineProps<{ titulo: string; subtitulo?: string }>()
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="flex items-center justify-between px-4 py-3 sm:px-6">
      <RouterLink to="/"><AppLogo /></RouterLink>
      <ThemeToggle />
    </header>

    <main class="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center sm:pt-0">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-bold text-text">{{ titulo }}</h1>
          <p v-if="subtitulo" class="mt-1 text-muted">{{ subtitulo }}</p>
        </div>
        <BaseCard>
          <slot />
        </BaseCard>
        <div class="mt-6 text-center text-sm text-muted">
          <slot name="rodape" />
        </div>
      </div>
    </main>

    <!-- faixa com a paleta da marca -->
    <div class="flex h-1.5" aria-hidden="true">
      <span class="flex-1 bg-brand-900" /><span class="flex-1 bg-brand-800" />
      <span class="flex-1 bg-brand-700" /><span class="flex-1 bg-brand-600" />
      <span class="flex-1 bg-brand-500" /><span class="flex-1 bg-brand-400" />
      <span class="flex-1 bg-brand-300" /><span class="flex-1 bg-brand-200" />
      <span class="flex-1 bg-brand-100" /><span class="flex-1 bg-brand-50" />
    </div>
  </div>
</template>
