<script setup lang="ts">
import { PhMagnifyingGlass, PhUsers, PhWarningCircle } from '@phosphor-icons/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSessionStore } from '@/modules/identity'
import { confirmar, type ConfirmOpcoes } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import { EmptyState } from '@/shared/ui'
import { membros } from '../..'
import {
  acoesPermitidas,
  filtrarSocios,
  type AcoesSocio,
  type GrupoStatus,
  type Socio,
} from '../../domain/Socio'
import SocioItem from '../components/SocioItem.vue'
import { useMembersStore } from '../stores/members'

const session = useSessionStore()
const store = useMembersStore()

const grupo = ref<GrupoStatus>('pendente')
const busca = ref('')
const ocupado = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([store.carregarSocios(), store.carregarMandatos()])
  if (!store.contagem.pendente) grupo.value = 'aprovado'
})

watch(grupo, () => (busca.value = ''))

// Cadastro não exige mais aprovação: "Pendentes" só aparece se sobrou alguém de antes.
const opcoes = computed(() => [
  ...(store.contagem.pendente
    ? [{ value: 'pendente' as const, label: 'Pendentes', contador: store.contagem.pendente }]
    : []),
  { value: 'aprovado' as const, label: 'Ativos', contador: store.contagem.aprovado },
  { value: 'inativo' as const, label: 'Inativos', contador: store.contagem.inativo },
])

const lista = computed(() => filtrarSocios(store.socios, grupo.value, busca.value))
const meuId = computed(() => session.conta?.id ?? '')

const ACOES: Record<keyof AcoesSocio, { confirmacao?: (s: Socio) => ConfirmOpcoes; sucesso: (s: Socio) => string }> = {
  aprovar: { sucesso: (s) => `${s.nome} foi aprovado(a) e receberá um e-mail.` },
  reativar: { sucesso: (s) => `${s.nome} foi reativado(a).` },
  rejeitar: {
    confirmacao: (s) => ({
      titulo: `Rejeitar o cadastro de ${s.nome}?`,
      mensagem: 'A pessoa não terá acesso ao app. Você pode reativar depois, se necessário.',
      confirmar: 'Rejeitar',
      tom: 'danger',
    }),
    sucesso: (s) => `Cadastro de ${s.nome} rejeitado.`,
  },
  desativar: {
    confirmacao: (s) => ({
      titulo: `Desativar ${s.nome}?`,
      mensagem: 'A pessoa perderá o acesso ao app. As inscrições já feitas serão mantidas.',
      confirmar: 'Desativar',
      tom: 'danger',
    }),
    sucesso: (s) => `${s.nome} foi desativado(a).`,
  },
  tornarAdmin: {
    confirmacao: (s) => ({
      titulo: `Tornar ${s.nome} admin?`,
      mensagem: 'Admins podem aprovar sócios, alterar permissões, definir Orgãs e gerenciar todas as escalas.',
      confirmar: 'Tornar admin',
    }),
    sucesso: (s) => `${s.nome} agora é admin.`,
  },
  removerAdmin: {
    confirmacao: (s) => ({
      titulo: `Remover o acesso de admin de ${s.nome}?`,
      mensagem: 'A pessoa continuará como sócia, sem permissões de administração.',
      confirmar: 'Remover admin',
      tom: 'danger',
    }),
    sucesso: (s) => `${s.nome} não é mais admin.`,
  },
}

async function executar(acao: keyof AcoesSocio, s: Socio) {
  const cfg = ACOES[acao]
  if (cfg.confirmacao && !(await confirmar(cfg.confirmacao(s)))) return

  ocupado.value = s.id
  const r = await membros[acao](s.id)
  if (r.ok) {
    toast(cfg.sucesso(s))
    await store.carregarSocios()
  } else {
    toast(r.error, 'danger')
  }
  ocupado.value = null
}

const TITULOS_VAZIO: Record<GrupoStatus, string> = {
  pendente: 'Nenhum cadastro aguardando aprovação',
  aprovado: 'Nenhum sócio cadastrado',
  inativo: 'Nenhum sócio inativo',
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs v-model="grupo">
        <TabsList class="h-9!">
          <TabsTrigger v-for="o in opcoes" :key="o.value" :value="o.value" class="gap-1.5 px-3">
            {{ o.label }}
            <span class="text-xs text-muted-foreground tabular-nums">{{ o.contador }}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div class="relative sm:w-72">
        <PhMagnifyingGlass class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="busca" type="search" class="h-10 pl-9" placeholder="Nome, e-mail ou telefone" aria-label="Buscar sócio" />
      </div>
    </div>

    <Alert v-if="store.erro" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ store.erro }}</AlertDescription>
    </Alert>

    <div v-if="store.carregandoSocios && !store.socios.length" class="flex justify-center py-12 text-primary">
      <Spinner class="size-6" />
    </div>

    <EmptyState
      v-else-if="!lista.length"
      :icone="PhUsers"
      :titulo="busca ? 'Ninguém encontrado' : TITULOS_VAZIO[grupo]"
      :descricao="busca ? 'Tente outro nome, e-mail ou telefone.' : undefined"
    />

    <ul v-else class="divide-y overflow-hidden rounded-xl border bg-card">
      <SocioItem
        v-for="s in lista"
        :key="s.id"
        :socio="s"
        :acoes="acoesPermitidas(s, meuId)"
        :is-orga="store.orgasVigentes.has(s.id)"
        :eu-mesmo="s.id === meuId"
        :ocupado="ocupado === s.id"
        @acao="executar($event, s)"
      />
    </ul>
  </section>
</template>
