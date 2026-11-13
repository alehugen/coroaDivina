<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { BaseAlert, BaseButton, BaseInput } from '@/shared/ui'
import { identidade } from '../..'
import { SENHA_MIN } from '../../domain/Cadastro'

const router = useRouter()
const senha = ref('')
const confirmacao = ref('')
const erro = ref('')
const carregando = ref(false)

async function salvar() {
  erro.value = ''
  carregando.value = true
  const r = await identidade.redefinirSenha(senha.value, confirmacao.value)
  carregando.value = false
  if (!r.ok) erro.value = r.error
  else router.replace('/escalas')
}
</script>

<template>
  <AuthLayout titulo="Nova senha">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="salvar">
      <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>
      <BaseInput
        v-model="senha"
        label="Nova senha"
        type="password"
        autocomplete="new-password"
        :hint="`Mínimo de ${SENHA_MIN} caracteres.`"
        required
      />
      <BaseInput
        v-model="confirmacao"
        label="Confirme a nova senha"
        type="password"
        autocomplete="new-password"
        required
      />
      <BaseButton type="submit" size="lg" block :loading="carregando">Salvar senha</BaseButton>
    </form>
  </AuthLayout>
</template>
