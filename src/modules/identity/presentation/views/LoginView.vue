<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { FormInput } from '@/shared/ui'
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
  // Login válido mas sem cadastro no app (ex.: conta excluída): não deixa preso no login
  if (!session.logado) {
    await session.sair({ recarregar: false })
    erro.value = 'Não encontramos seu cadastro. Faça um novo cadastro ou fale com a administração.'
    return
  }
  const r2 = route.query.r
  router.replace(typeof r2 === 'string' && r2.startsWith('/') ? r2 : '/escalas')
}
</script>

<template>
  <AuthLayout titulo="Entrar" subtitulo="Acesse as escalas de trabalho do núcleo">
    <form novalidate @submit.prevent="entrar">
      <FieldGroup>
        <Alert v-if="erro" variant="destructive">
          <PhWarningCircle />
          <AlertDescription>{{ erro }}</AlertDescription>
        </Alert>
        <FormInput v-model="email" label="E-mail" type="email" autocomplete="email" required />
        <div class="flex flex-col gap-2">
          <FormInput v-model="senha" label="Senha" type="password" autocomplete="current-password" required />
          <RouterLink to="/esqueci-senha" class="self-end text-sm font-medium text-primary hover:underline">
            Esqueci minha senha
          </RouterLink>
        </div>
        <Button type="submit" size="lg" class="h-11 w-full" :disabled="carregando">
          <Spinner v-if="carregando" />
          Entrar
        </Button>
      </FieldGroup>
    </form>

    <template #rodape>
      Ainda não tem cadastro?
      <RouterLink to="/cadastro" class="font-semibold text-primary hover:underline">Cadastre-se</RouterLink>
    </template>
  </AuthLayout>
</template>
