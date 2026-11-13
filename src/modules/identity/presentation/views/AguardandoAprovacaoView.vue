<script setup lang="ts">
import { PhHourglassMedium, PhProhibit } from '@phosphor-icons/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { primeiroNome } from '../../domain/Conta'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()
const router = useRouter()
const verificando = ref(false)

const recusado = computed(() => ['rejeitado', 'inativo'].includes(session.conta?.status ?? ''))

async function verificar() {
  verificando.value = true
  await session.recarregar()
  verificando.value = false
  if (session.aprovado) router.replace('/escalas')
}

async function sair() {
  await session.sair()
  router.replace('/entrar')
}
</script>

<template>
  <AuthLayout :titulo="recusado ? 'Acesso indisponível' : `Olá, ${primeiroNome(session.conta)}!`">
    <div class="flex flex-col items-center gap-4 text-center">
      <span
        class="flex size-14 items-center justify-center rounded-full"
        :class="recusado ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground'"
      >
        <component :is="recusado ? PhProhibit : PhHourglassMedium" class="size-7" />
      </span>
      <template v-if="recusado">
        <p>Seu acesso não está ativo no momento.</p>
        <p class="text-sm text-muted-foreground">Em caso de dúvida, procure a administração do núcleo.</p>
      </template>
      <template v-else>
        <p>Seu cadastro foi recebido e está <strong>aguardando aprovação</strong>.</p>
        <p class="text-sm text-muted-foreground">
          Você receberá um e-mail assim que um administrador liberar seu acesso.
        </p>
        <Button variant="outline" size="lg" :disabled="verificando" @click="verificar">
          <Spinner v-if="verificando" />
          Verificar novamente
        </Button>
      </template>
      <Button variant="link" class="text-muted-foreground" @click="sair">Sair</Button>
    </div>
  </AuthLayout>
</template>
