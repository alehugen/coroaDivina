<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import { BaseAlert, BaseButton, BaseInput } from '@/shared/ui'
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
    <form class="flex flex-col gap-4" novalidate @submit.prevent="cadastrar">
      <BaseAlert v-if="erros.geral" tone="danger">{{ erros.geral }}</BaseAlert>
      <BaseInput v-model="form.nome" label="Nome completo" autocomplete="name" :error="erros.nome" required />
      <BaseInput
        v-model="form.email"
        label="E-mail"
        type="email"
        autocomplete="email"
        :error="erros.email"
        required
      />
      <BaseInput
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
      <BaseInput
        v-model="form.senha"
        label="Senha"
        type="password"
        autocomplete="new-password"
        :hint="`Mínimo de ${SENHA_MIN} caracteres.`"
        :error="erros.senha"
        required
      />
      <BaseInput
        v-model="form.confirmacaoSenha"
        label="Confirme a senha"
        type="password"
        autocomplete="new-password"
        :error="erros.confirmacaoSenha"
        required
      />
      <BaseButton type="submit" size="lg" block :loading="carregando">Cadastrar</BaseButton>
    </form>

    <template #rodape>
      Já tem cadastro?
      <RouterLink to="/entrar" class="font-semibold text-primary hover:underline">Entrar</RouterLink>
    </template>
  </AuthLayout>

  <AuthLayout v-else titulo="Confirme seu e-mail">
    <div class="flex flex-col gap-4 text-center">
      <p class="text-text">
        Enviamos um link de confirmação para <strong>{{ form.email.trim() }}</strong>.
      </p>
      <p class="text-sm text-muted">
        Depois de confirmar, seu cadastro ficará aguardando a aprovação de um administrador. Você
        receberá um e-mail quando for aprovado.
      </p>
      <RouterLink to="/entrar" class="font-semibold text-primary hover:underline">
        Ir para o login
      </RouterLink>
    </div>
  </AuthLayout>
</template>
