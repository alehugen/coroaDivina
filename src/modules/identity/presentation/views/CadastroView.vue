<script setup lang="ts">
import { PhEnvelopeSimple, PhWarningCircle } from '@phosphor-icons/vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { FormInput } from '@/shared/ui'
import { identidade } from '../..'
import type { ErrosCadastroUI } from '../../application/use-cases'
import { SENHA_MIN, type DadosCadastro } from '../../domain/Cadastro'
import { mascararTelefone } from '../../domain/Telefone'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const session = useSessionStore()

const form = reactive<DadosCadastro>({
  nome: '',
  email: '',
  telefone: '',
  senha: '',
  confirmacaoSenha: '',
})
const erros = ref<ErrosCadastroUI>({})
const carregando = ref(false)
const confirmarEmail = ref(false)

async function cadastrar() {
  erros.value = {}
  carregando.value = true
  const r = await identidade.cadastrarSocio(form)
  carregando.value = false
  if (!r.ok) {
    erros.value = r.error
    return
  }
  if (r.value.precisaConfirmarEmail) {
    confirmarEmail.value = true
    return
  }
  await session.recarregar()
  router.replace('/aguardando-aprovacao')
}
</script>

<template>
  <AuthLayout
    v-if="!confirmarEmail"
    titulo="Cadastro de sócio"
    subtitulo="Após o cadastro, um administrador irá aprovar seu acesso."
  >
    <form novalidate @submit.prevent="cadastrar">
      <FieldGroup>
        <Alert v-if="erros.geral" variant="destructive">
          <PhWarningCircle />
          <AlertDescription>{{ erros.geral }}</AlertDescription>
        </Alert>
        <FormInput v-model="form.nome" label="Nome completo" autocomplete="name" :error="erros.nome" required />
        <FormInput
          v-model="form.email"
          label="E-mail"
          type="email"
          autocomplete="email"
          :error="erros.email"
          required
        />
        <FormInput
          v-model="form.telefone"
          label="Telefone (WhatsApp)"
          type="tel"
          autocomplete="tel"
          inputmode="numeric"
          placeholder="(41) 99999-0000"
          :mascara="mascararTelefone"
          :error="erros.telefone"
          required
        />
        <FormInput
          v-model="form.senha"
          label="Senha"
          type="password"
          autocomplete="new-password"
          :hint="`Mínimo de ${SENHA_MIN} caracteres.`"
          :error="erros.senha"
          required
        />
        <FormInput
          v-model="form.confirmacaoSenha"
          label="Confirme a senha"
          type="password"
          autocomplete="new-password"
          :error="erros.confirmacaoSenha"
          required
        />
        <Button type="submit" size="lg" class="h-11 w-full" :disabled="carregando">
          <Spinner v-if="carregando" />
          Cadastrar
        </Button>
      </FieldGroup>
    </form>

    <template #rodape>
      Já tem cadastro?
      <RouterLink to="/entrar" class="font-semibold text-primary hover:underline">Entrar</RouterLink>
    </template>
  </AuthLayout>

  <AuthLayout v-else titulo="Confirme seu e-mail">
    <div class="flex flex-col items-center gap-4 text-center">
      <span class="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <PhEnvelopeSimple class="size-7" />
      </span>
      <p>
        Enviamos um link de confirmação para <strong>{{ form.email.trim() }}</strong>.
      </p>
      <p class="text-sm text-muted-foreground">
        Depois de confirmar, seu cadastro ficará aguardando a aprovação de um administrador. Você
        receberá um e-mail quando for aprovado.
      </p>
      <RouterLink to="/entrar" class="font-semibold text-primary hover:underline">Ir para o login</RouterLink>
    </div>
  </AuthLayout>
</template>
