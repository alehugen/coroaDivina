<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { primeiroNome, useSessionStore } from '@/modules/identity'
import { AppLogo, BaseBadge, ThemeToggle } from '@/shared/ui'

const session = useSessionStore()
const router = useRouter()

const links = computed(() => [
  { to: '/escalas', label: 'Escalas', visivel: true },
  { to: '/minhas-escalas', label: 'Minhas escalas', visivel: true },
  // TODO(fase escalas): liberar para session.gestor quando a Orgã tiver abas próprias
  { to: '/admin', label: 'Administração', visivel: session.admin },
])

async function sair() {
  await session.sair()
  router.replace('/entrar')
}
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <RouterLink to="/escalas" class="shrink-0"><AppLogo /></RouterLink>

        <nav class="hidden flex-1 items-center gap-1 md:flex" aria-label="Principal">
          <template v-for="l in links" :key="l.to">
            <RouterLink
              v-if="l.visivel"
              :to="l.to"
              class="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text"
              active-class="!bg-primary-soft !text-primary"
            >
              {{ l.label }}
            </RouterLink>
          </template>
        </nav>

        <div class="ml-auto flex items-center gap-1">
          <div class="mr-2 hidden text-right sm:block">
            <p class="text-sm font-medium text-text">{{ primeiroNome(session.conta) }}</p>
            <BaseBadge v-if="session.admin" tone="primary">Admin</BaseBadge>
            <BaseBadge v-else-if="session.conta?.isOrga" tone="accent">Orgã</BaseBadge>
          </div>
          <ThemeToggle />
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text"
            @click="sair"
          >
            Sair
          </button>
        </div>
      </div>

      <!-- navegação mobile -->
      <nav class="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden" aria-label="Principal">
        <template v-for="l in links" :key="l.to">
          <RouterLink
            v-if="l.visivel"
            :to="l.to"
            class="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted"
            active-class="!bg-primary-soft !text-primary"
          >
            {{ l.label }}
          </RouterLink>
        </template>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <RouterView />
    </main>
  </div>
</template>
