<script setup lang="ts">
import { PhHourglassMedium, PhTrash, PhWarningCircle } from '@phosphor-icons/vue'
import { reactive, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { confirmar } from '@/shared/composables/useConfirm'
import { useTamanhoTexto } from '@/shared/composables/useTamanhoTexto'
import { toast } from '@/shared/composables/useToast'
import { formatarData } from '@/shared/lib/datas'
import { FormInput } from '@/shared/ui'
import { identidade } from '../..'
import { SENHA_MIN, type ErrosPerfil } from '../../domain/Cadastro'
import { NOME_GRAU } from '../../domain/Grau'
import GrauBadge from '../components/GrauBadge.vue'
import { formatarTelefone, mascararTelefone } from '../../domain/Telefone'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()
const { textoGrande } = useTamanhoTexto()

// --- dados
const dados = reactive({ nome: '', telefone: '' })
const erros = ref<ErrosPerfil & { geral?: string }>({})
const salvandoDados = ref(false)

// Observa cada valor salvo separadamente (fontes múltiplas comparam valor a valor): recarregar a
// conta sem mudar nome/telefone (ex.: após trocar a senha) não apaga edições em andamento
watch(
  [() => session.conta?.nome ?? '', () => session.conta?.telefone ?? ''],
  ([nome, telefone]) => {
    dados.nome = nome
    dados.telefone = telefone ? formatarTelefone(telefone) : ''
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

// --- lembretes
async function alternarLembretes(receber: boolean) {
  if (!session.conta) return
  const r = await identidade.definirLembretes(session.conta.id, receber)
  if (!r.ok) return toast(r.error, 'danger')
  await session.recarregar()
  toast(receber ? 'Você vai receber lembretes na véspera.' : 'Lembretes desligados.')
}

// --- exclusão
const processandoExclusao = ref(false)

async function pedirExclusao() {
  const ok = await confirmar({
    titulo: 'Pedir a exclusão da sua conta?',
    mensagem:
      'Um administrador vai analisar o pedido. Se aprovado, sua conta e suas inscrições serão apagadas de vez. Até lá, você continua usando o app normalmente.',
    confirmar: 'Pedir exclusão',
    tom: 'danger',
  })
  if (!ok) return
  processandoExclusao.value = true
  const r = await identidade.solicitarExclusao()
  processandoExclusao.value = false
  if (!r.ok) return toast(r.error, 'danger')
  await session.recarregar()
  toast('Pedido enviado aos administradores.')
}

async function desistirExclusao() {
  processandoExclusao.value = true
  const r = await identidade.cancelarSolicitacaoExclusao()
  processandoExclusao.value = false
  if (!r.ok) return toast(r.error, 'danger')
  await session.recarregar()
  toast('Pedido de exclusão cancelado.')
}
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold">Meu perfil</h1>
      <p v-if="session.conta" class="flex items-center gap-2 text-sm text-muted-foreground">
        <GrauBadge :grau="session.conta.grau" /> {{ NOME_GRAU[session.conta.grau] }}
      </p>
    </div>

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

    <Card>
      <CardHeader>
        <CardTitle>Preferências</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-5">
        <Field orientation="horizontal">
          <Switch id="perfil-texto" v-model="textoGrande" />
          <FieldLabel for="perfil-texto" class="flex-col items-start gap-0.5 font-normal">
            <span class="font-medium">Texto maior</span>
            <span class="text-sm text-muted-foreground">Aumenta letras e botões neste aparelho.</span>
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Switch
            id="perfil-lembretes"
            :model-value="session.conta?.receberLembretes ?? true"
            @update:model-value="alternarLembretes"
          />
          <FieldLabel for="perfil-lembretes" class="flex-col items-start gap-0.5 font-normal">
            <span class="font-medium">Receber lembrete por e-mail na véspera</span>
            <span class="text-sm text-muted-foreground">Às 18h do dia anterior, com as funções que você vai fazer.</span>
          </FieldLabel>
        </Field>
      </CardContent>
    </Card>

    <Card class="ring-destructive/30">
      <CardHeader>
        <CardTitle class="text-destructive">Excluir minha conta</CardTitle>
        <CardDescription>
          A exclusão é permanente e precisa da aprovação de um administrador. Suas inscrições também serão apagadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert v-if="session.conta?.exclusaoSolicitadaEm" class="border-warning/40 bg-warning-soft">
          <PhHourglassMedium class="text-warning" />
          <AlertDescription class="text-foreground">
            Pedido enviado em {{ formatarData(session.conta.exclusaoSolicitadaEm) }}. Aguardando um administrador.
          </AlertDescription>
        </Alert>
        <div class="mt-4 flex">
          <Button
            v-if="session.conta?.exclusaoSolicitadaEm"
            variant="outline"
            size="lg"
            :disabled="processandoExclusao"
            @click="desistirExclusao"
          >
            <Spinner v-if="processandoExclusao" />
            Desistir do pedido
          </Button>
          <Button v-else variant="destructive" size="lg" :disabled="processandoExclusao" @click="pedirExclusao">
            <Spinner v-if="processandoExclusao" />
            <PhTrash v-else />
            Pedir exclusão da conta
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
