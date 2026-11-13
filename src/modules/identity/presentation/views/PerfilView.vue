<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { reactive, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/shared/composables/useToast'
import { FormInput } from '@/shared/ui'
import { identidade } from '../..'
import { SENHA_MIN, type ErrosPerfil } from '../../domain/Cadastro'
import { formatarTelefone, mascararTelefone } from '../../domain/Telefone'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()

// --- dados
const dados = reactive({ nome: '', telefone: '' })
const erros = ref<ErrosPerfil & { geral?: string }>({})
const salvandoDados = ref(false)

watch(
  () => session.conta,
  (c) => {
    dados.nome = c?.nome ?? ''
    dados.telefone = c?.telefone ? formatarTelefone(c.telefone) : ''
  },
  { immediate: true },
)

async function salvarDados() {
  if (!session.conta) return
  erros.value = {}
  salvandoDados.value = true
  const r = await identidade.atualizarPerfil(session.conta.id, { ...dados })
  salvandoDados.value = false
  if (!r.ok) {
    erros.value = r.error
    return
  }
  await session.recarregar()
  toast('Seus dados foram salvos.')
}

// --- senha
const senha = reactive({ nova: '', confirmacao: '' })
const erroSenha = ref('')
const salvandoSenha = ref(false)

async function salvarSenha() {
  erroSenha.value = ''
  salvandoSenha.value = true
  const r = await identidade.redefinirSenha(senha.nova, senha.confirmacao)
  salvandoSenha.value = false
  if (!r.ok) {
    erroSenha.value = r.error
    return
  }
  senha.nova = ''
  senha.confirmacao = ''
  toast('Senha alterada.')
}
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col gap-6">
    <h1 class="text-2xl font-bold">Meu perfil</h1>

    <Card>
      <CardHeader>
        <CardTitle>Seus dados</CardTitle>
        <CardDescription>Seu nome aparece para a equipe nas escalas. O telefone só a Orgã e os admins veem.</CardDescription>
      </CardHeader>
      <CardContent>
        <form novalidate @submit.prevent="salvarDados">
          <FieldGroup class="gap-4">
            <Alert v-if="erros.geral" variant="destructive">
              <PhWarningCircle />
              <AlertDescription>{{ erros.geral }}</AlertDescription>
            </Alert>
            <FormInput v-model="dados.nome" label="Nome completo" autocomplete="name" :error="erros.nome" required />
            <FormInput
              v-model="dados.telefone"
              label="Telefone (WhatsApp)"
              type="tel"
              autocomplete="tel"
              inputmode="numeric"
              :mascara="mascararTelefone"
              :error="erros.telefone"
              required
            />
            <Field>
              <FieldLabel for="perfil-email">E-mail</FieldLabel>
              <Input id="perfil-email" :model-value="session.conta?.email" class="h-10" disabled />
              <FieldDescription>Para trocar o e-mail, fale com um administrador.</FieldDescription>
            </Field>
            <Button type="submit" size="lg" class="h-10 self-start" :disabled="salvandoDados">
              <Spinner v-if="salvandoDados" />
              Salvar dados
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Trocar senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form novalidate @submit.prevent="salvarSenha">
          <FieldGroup class="gap-4">
            <Alert v-if="erroSenha" variant="destructive">
              <PhWarningCircle />
              <AlertDescription>{{ erroSenha }}</AlertDescription>
            </Alert>
            <FormInput
              v-model="senha.nova"
              label="Nova senha"
              type="password"
              autocomplete="new-password"
              :hint="`Mínimo de ${SENHA_MIN} caracteres.`"
              required
            />
            <FormInput
              v-model="senha.confirmacao"
              label="Confirme a nova senha"
              type="password"
              autocomplete="new-password"
              required
            />
            <Button type="submit" size="lg" variant="outline" class="h-10 self-start" :disabled="salvandoSenha">
              <Spinner v-if="salvandoSenha" />
              Trocar senha
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
