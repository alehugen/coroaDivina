<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Spinner } from '@/components/ui/spinner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useSessionStore } from '@/modules/identity'
import { useTamanhoTexto } from '@/shared/composables/useTamanhoTexto'
import { AppToaster, ConfirmDialogHost } from '@/shared/ui'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()
useTamanhoTexto() // aplica a preferência "Texto maior"

// Sessão encerrada fora do fluxo normal (saiu em outra aba, token expirou, conta excluída):
// volta para o login em vez de deixar a tela "logada" sem dados.
watch(
  () => session.logado,
  (logado, antes) => {
    if (antes && !logado && !route.meta.visitante && !route.meta.publica) {
      router.replace({ path: '/entrar', query: { r: route.fullPath } })
    }
  },
)
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
