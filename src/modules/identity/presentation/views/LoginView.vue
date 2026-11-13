<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { BaseAlert, BaseButton, BaseInput } from '@/shared/ui'
import { identidade } from '../..'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()

const email = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)

async function entrar() {
  erro.value = ''
  carregando.value = true
  const r = await identidade.entrar(email.value, senha.value)
  if (!r.ok) {
    erro.value = r.error
    carregando.value = false
    return
  }
  await session.recarregar()
  carregando.value = false
  const destino = typeof route.query.r === 'string' && route.query.r.startsWith('/') ? route.query.r : '/escalas'
  router.replace(destino)
}
</script>

<template>
  <AuthLayout titulo="Entrar" subtitulo="Acesse as escalas de trabalho do núcleo">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="entrar">
      <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>
      <BaseInput v-model="email" label="E-mail" type="email" autocomplete="email" required />
      <BaseInput
        v-model="senha"
        label="Senha"
        type="password"
        autocomplete="current-password"
        required
      />
      <div class="-mt-1 text-right">
        <RouterLink to="/esqueci-senha" class="text-sm font-medium text-primary hover:underline">
          Esqueci minha senha
        </RouterLink>
      </div>
      <BaseButton type="submit" size="lg" block :loading="carregando">Entrar</BaseButton>
    </form>

    <template #rodape>
      Ainda não tem cadastro?
      <RouterLink to="/cadastro" class="font-semibold text-primary hover:underline">
        Cadastre-se
      </RouterLink>
    </template>
  </AuthLayout>
</template>
