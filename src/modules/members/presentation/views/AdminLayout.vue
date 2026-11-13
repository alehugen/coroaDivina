<script setup lang="ts">
import { PhCalendarDots, PhCrown, PhListChecks, PhUsers } from '@phosphor-icons/vue'
import { computed, onMounted } from 'vue'
import { useSessionStore } from '@/modules/identity'
import { useMembersStore } from '../stores/members'

const session = useSessionStore()
const store = useMembersStore()

const abas = computed(() =>
  [
    { to: '/admin/escalas', label: 'Escalas', icone: PhCalendarDots, visivel: true },
    { to: '/admin/funcoes', label: 'Funções', icone: PhListChecks, visivel: true },
    { to: '/admin/socios', label: 'Sócios', icone: PhUsers, contador: store.contagem.pendente, visivel: session.admin },
    { to: '/admin/orgas', label: 'Orgãs', icone: PhCrown, visivel: session.admin },
  ].filter((a) => a.visivel),
)

onMounted(() => {
  if (session.admin && !store.socios.length) store.carregarSocios()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold">Administração</h1>
      <nav class="mt-4 flex gap-1 overflow-x-auto border-b" aria-label="Administração">
        <RouterLink
          v-for="a in abas"
          :key="a.to"
          :to="a.to"
          class="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          active-class="!border-primary !text-primary"
        >
          <component :is="a.icone" class="size-4" />
          {{ a.label }}
          <span
            v-if="a.contador"
            class="rounded-full bg-highlight px-1.5 text-xs font-semibold text-highlight-foreground"
            :aria-label="`${a.contador} pendentes`"
          >
            {{ a.contador }}
          </span>
        </RouterLink>
      </nav>
    </div>
    <RouterView />
  </div>
</template>
