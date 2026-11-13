<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/shared/composables/useToast'
import { FormInput } from '@/shared/ui'
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
  if (!r.ok) {
    erro.value = r.error
    return
  }
  toast('Senha alterada.')
  router.replace('/escalas')
}
</script>

<template>
  <AuthLayout titulo="Nova senha">
    <form novalidate @submit.prevent="salvar">
      <FieldGroup>
        <Alert v-if="erro" variant="destructive">
          <PhWarningCircle />
          <AlertDescription>{{ erro }}</AlertDescription>
        </Alert>
        <FormInput
          v-model="senha"
          label="Nova senha"
          type="password"
          autocomplete="new-password"
          :hint="`Mínimo de ${SENHA_MIN} caracteres.`"
          required
        />
        <FormInput v-model="confirmacao" label="Confirme a nova senha" type="password" autocomplete="new-password" required />
        <Button type="submit" size="lg" class="h-11 w-full" :disabled="carregando">
          <Spinner v-if="carregando" />
          Salvar senha
        </Button>
      </FieldGroup>
    </form>
  </AuthLayout>
</template>
