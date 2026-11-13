<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSessionStore } from '@/modules/identity'
import { useMembersStore } from '../stores/members'

const session = useSessionStore()
const store = useMembersStore()

const abas = computed(() => [
  { to: '/admin/escalas', label: 'Escalas', visivel: true },
  { to: '/admin/funcoes', label: 'Funções', visivel: true },
  { to: '/admin/socios', label: 'Sócios', contador: store.contagem.pendente, visivel: session.admin },
  { to: '/admin/orgas', label: 'Orgãs', visivel: session.admin },
])

onMounted(() => {
  if (session.admin && !store.socios.length) store.carregarSocios()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold text-text">Administração</h1>
      <nav class="mt-4 flex gap-1 overflow-x-auto border-b border-border" aria-label="Administração">
        <template v-for="a in abas" :key="a.to">
          <RouterLink
            v-if="a.visivel"
            :to="a.to"
            class="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted hover:text-text"
            active-class="!border-primary !text-primary"
          >
            {{ a.label }}
            <span
              v-if="a.contador"
              class="rounded-full bg-accent px-1.5 text-xs font-semibold text-on-accent"
              :aria-label="`${a.contador} pendentes`"
            >
              {{ a.contador }}
            </span>
          </RouterLink>
        </template>
      </nav>
    </div>
    <RouterView />
  </div>
</template>
