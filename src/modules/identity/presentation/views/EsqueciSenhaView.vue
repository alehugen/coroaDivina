<script setup lang="ts">
import { ref } from 'vue'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { BaseAlert, BaseButton, BaseInput } from '@/shared/ui'
import { identidade } from '../..'

const email = ref('')
const erro = ref('')
const enviado = ref(false)
const carregando = ref(false)

async function enviar() {
  erro.value = ''
  carregando.value = true
  const r = await identidade.solicitarRedefinicao(
    email.value,
    `${window.location.origin}/redefinir-senha`,
  )
  carregando.value = false
  if (!r.ok) erro.value = r.error
  else enviado.value = true
}
</script>

<template>
  <AuthLayout titulo="Recuperar senha" subtitulo="Enviaremos um link para você criar uma nova senha.">
    <BaseAlert v-if="enviado" tone="success">
      Se houver um cadastro com esse e-mail, você receberá o link em instantes.
    </BaseAlert>
    <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="enviar">
      <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>
      <BaseInput v-model="email" label="E-mail" type="email" autocomplete="email" required />
      <BaseButton type="submit" size="lg" block :loading="carregando">Enviar link</BaseButton>
    </form>

    <template #rodape>
      <RouterLink to="/entrar" class="font-semibold text-primary hover:underline">
        Voltar para o login
      </RouterLink>
    </template>
  </AuthLayout>
</template>
