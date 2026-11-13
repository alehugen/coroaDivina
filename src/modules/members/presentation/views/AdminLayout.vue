<script setup lang="ts">
import { PhCalendarDots, PhCrown, PhListChecks, PhUsers } from '@phosphor-icons/vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/modules/identity'
import { useMembersStore } from '../stores/members'

const session = useSessionStore()
const store = useMembersStore()

const abas = computed(() =>
  [
    { to: '/admin/escalas', label: 'Escalas', icone: PhCalendarDots, visivel: true },
    { to: '/admin/funcoes', label: 'Funções', icone: PhListChecks, visivel: true },
    { to: '/admin/socios', label: 'Sócios', icone: PhUsers, contador: store.contagem.pendente + store.contagem.exclusao, visivel: session.admin },
    { to: '/admin/orgas', label: 'Orgãs', icone: PhCrown, visivel: session.admin },
  ].filter((a) => a.visivel),
)

onMounted(() => {
  if (session.admin && !store.socios.length) store.carregarSocios()
})

// No celular as abas rolam: mantém a aba ativa à vista
const navAbas = ref<HTMLElement>()
const route = useRoute()
watch(
  () => route.path,
  async () => {
    await nextTick()
    navAbas.value?.querySelector('.router-link-active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold">Administração</h1>
      <nav ref="navAbas" class="mt-4 flex gap-1 overflow-x-auto border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Administração">
        <RouterLink
          v-for="a in abas"
          :key="a.to"
          :to="a.to"
          class="-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-2.5 py-2.5 sm:gap-2 sm:px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
