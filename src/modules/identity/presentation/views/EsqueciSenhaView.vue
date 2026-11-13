<script setup lang="ts">
import { PhCheckCircle, PhWarningCircle } from '@phosphor-icons/vue'
import { ref } from 'vue'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { FormInput } from '@/shared/ui'
import { identidade } from '../..'

const email = ref('')
const erro = ref('')
const enviado = ref(false)
const carregando = ref(false)

async function enviar() {
  erro.value = ''
  carregando.value = true
  const r = await identidade.solicitarRedefinicao(email.value, `${window.location.origin}/redefinir-senha`)
  carregando.value = false
  if (!r.ok) erro.value = r.error
  else enviado.value = true
}
</script>

<template>
  <AuthLayout titulo="Recuperar senha" subtitulo="Enviaremos um link para você criar uma nova senha.">
    <Alert v-if="enviado">
      <PhCheckCircle class="text-success" />
      <AlertDescription>
        Se houver um cadastro com esse e-mail, você receberá o link em instantes.
      </AlertDescription>
    </Alert>
    <form v-else novalidate @submit.prevent="enviar">
      <FieldGroup>
        <Alert v-if="erro" variant="destructive">
          <PhWarningCircle />
          <AlertDescription>{{ erro }}</AlertDescription>
        </Alert>
        <FormInput v-model="email" label="E-mail" type="email" autocomplete="email" required />
        <Button type="submit" size="lg" class="h-11 w-full" :disabled="carregando">
          <Spinner v-if="carregando" />
          Enviar link
        </Button>
      </FieldGroup>
    </form>

    <template #rodape>
      <RouterLink to="/entrar" class="font-semibold text-primary hover:underline">Voltar para o login</RouterLink>
    </template>
  </AuthLayout>
</template>
