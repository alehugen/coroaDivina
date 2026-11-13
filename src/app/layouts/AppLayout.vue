<script setup lang="ts">
import {
  PhCalendarCheck,
  PhCalendarDots,
  PhGearSix,
  PhDeviceMobile,
  PhSignOut,
  PhUserCircle,
} from '@phosphor-icons/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { primeiroNome, useSessionStore } from '@/modules/identity'
import { useInstalarApp } from '@/shared/composables/useInstalarApp'
import { AppLogo, InstalarApp, ThemeToggle, UserAvatar } from '@/shared/ui'

const session = useSessionStore()
const router = useRouter()

const links = computed(() =>
  [
    { to: '/escalas', label: 'Escalas', icone: PhCalendarDots, visivel: true },
    { to: '/minhas-escalas', label: 'Minhas escalas', icone: PhCalendarCheck, visivel: true },
    { to: '/admin', label: 'Administração', icone: PhGearSix, visivel: session.gestor },
  ].filter((l) => l.visivel),
)

const route = useRoute()
const abaAtiva = computed(() => links.value.findIndex((l) => route.path.startsWith(l.to)))

const instalarApp = ref<InstanceType<typeof InstalarApp>>()
const { modo: modoInstalacao } = useInstalarApp()

async function sair() {
  await session.sair()
  router.replace('/entrar')
}
</script>

<template>
  <div class="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
    <header class="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <RouterLink to="/escalas" class="shrink-0"><AppLogo /></RouterLink>

        <nav class="hidden flex-1 items-center gap-1 md:flex" aria-label="Principal">
          <RouterLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            active-class="!bg-accent !text-accent-foreground"
          >
            <component :is="l.icone" class="size-4" />
            {{ l.label }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="h-10 gap-2 px-1.5" aria-label="Menu da conta">
                <UserAvatar :nome="session.conta?.nome ?? ''" size="default" />
                <span class="hidden text-sm font-medium sm:inline">{{ primeiroNome(session.conta) }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel class="flex flex-col gap-1">
                <span class="truncate text-foreground">{{ session.conta?.nome }}</span>
                <span class="truncate text-xs font-normal text-muted-foreground">{{ session.conta?.email }}</span>
                <span class="flex gap-1">
                  <Badge v-if="session.admin">Admin</Badge>
                  <Badge v-if="session.conta?.isOrga" class="bg-highlight text-highlight-foreground">Orgã</Badge>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @select="router.push('/perfil')">
                <PhUserCircle />
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem v-if="modoInstalacao" @select="instalarApp?.instalar()">
                <PhDeviceMobile />
                Instalar o app
              </DropdownMenuItem>
              <DropdownMenuItem @select="sair">
                <PhSignOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    <InstalarApp ref="instalarApp" />

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <!-- Troca de tela: a antiga sai para a esquerda e a nova entra (0,2s); some com "reduzir movimento" -->
      <RouterView v-slot="{ Component, route: r }">
        <Transition
          mode="out-in"
          enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
          enter-from-class="opacity-0 translate-x-3"
          leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
          leave-to-class="opacity-0 -translate-x-3"
        >
          <component :is="Component" :key="r.matched[1]?.path ?? r.path" />
        </Transition>
      </RouterView>
    </main>

    <!-- navegação inferior no celular, com pílula que desliza até a aba ativa -->
    <nav
      class="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      aria-label="Principal"
    >
      <div class="relative flex">
        <span
          v-if="abaAtiva >= 0"
          class="absolute inset-y-0 left-0 rounded-xl bg-accent transition-transform duration-300 ease-[cubic-bezier(.3,1.2,.4,1)] motion-reduce:transition-none"
          :style="{ width: `${100 / links.length}%`, transform: `translateX(${abaAtiva * 100}%)` }"
          aria-hidden="true"
        />
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium text-muted-foreground"
          active-class="!text-primary"
        >
          <component :is="l.icone" class="size-6" :weight="route.path.startsWith(l.to) ? 'fill' : 'regular'" />
          {{ l.label }}
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
