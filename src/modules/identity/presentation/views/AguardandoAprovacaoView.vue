<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { BaseButton } from '@/shared/ui'
import { primeiroNome } from '../../domain/Conta'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()
const router = useRouter()
const verificando = ref(false)

const recusado = computed(() =>
  ['rejeitado', 'inativo'].includes(session.conta?.status ?? ''),
)

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
  <AuthLayout
    :titulo="recusado ? 'Acesso indisponível' : `Olá, ${primeiroNome(session.conta)}!`"
  >
    <div class="flex flex-col gap-4 text-center">
      <template v-if="recusado">
        <p class="text-text">Seu acesso não está ativo no momento.</p>
        <p class="text-sm text-muted">Em caso de dúvida, procure a administração do núcleo.</p>
      </template>
      <template v-else>
        <p class="text-text">Seu cadastro foi recebido e está <strong>aguardando aprovação</strong>.</p>
        <p class="text-sm text-muted">
          Você receberá um e-mail assim que um administrador liberar seu acesso.
        </p>
        <BaseButton variant="secondary" :loading="verificando" @click="verificar">
          Verificar novamente
        </BaseButton>
      </template>
      <button type="button" class="text-sm font-medium text-muted hover:text-text" @click="sair">
        Sair
      </button>
    </div>
  </AuthLayout>
</template>
