<script setup lang="ts">
import { PhProhibit } from '@phosphor-icons/vue'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '../stores/session'

/** Conta desativada pela administração (o cadastro não exige mais aprovação). */
const session = useSessionStore()
</script>

<template>
  <AuthLayout titulo="Acesso indisponível">
    <div class="flex flex-col items-center gap-4 text-center">
      <span class="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <PhProhibit class="size-7" />
      </span>
      <p>Seu acesso não está ativo no momento.</p>
      <p class="text-sm text-muted-foreground">Em caso de dúvida, procure a administração do núcleo.</p>
      <Button variant="outline" size="lg" @click="session.sair()">Sair</Button>
    </div>
  </AuthLayout>
</template>
