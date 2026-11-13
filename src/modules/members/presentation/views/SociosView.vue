<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSessionStore } from '@/modules/identity'
import { confirmar, type ConfirmOpcoes } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import { BaseAlert, BaseInput, BaseSpinner, EmptyState, SegmentedControl } from '@/shared/ui'
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

const opcoes = computed(() => [
  { value: 'pendente' as const, label: 'Pendentes', contador: store.contagem.pendente },
  { value: 'aprovado' as const, label: 'Aprovados', contador: store.contagem.aprovado },
  { value: 'inativo' as const, label: 'Inativos', contador: store.contagem.inativo },
])

const lista = computed(() => filtrarSocios(store.socios, grupo.value, busca.value))
const meuId = computed(() => session.conta?.id ?? '')

const ACOES: Record<
  keyof AcoesSocio,
  { confirmacao?: (s: Socio) => ConfirmOpcoes; sucesso: (s: Socio) => string }
> = {
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
      mensagem:
        'Admins podem aprovar sócios, alterar permissões, definir Orgãs e gerenciar todas as escalas.',
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
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <SegmentedControl v-model="grupo" :opcoes="opcoes" rotulo="Filtrar sócios por situação" />
      <div class="sm:w-72">
        <BaseInput v-model="busca" label="Buscar" type="search" placeholder="Nome, e-mail ou telefone" />
      </div>
    </div>

    <BaseAlert v-if="store.erro" tone="danger">{{ store.erro }}</BaseAlert>

    <div v-if="store.carregandoSocios && !store.socios.length" class="flex justify-center py-12 text-primary">
      <BaseSpinner class="size-6" />
    </div>

    <EmptyState
      v-else-if="!lista.length"
      :titulo="
        busca
          ? 'Ninguém encontrado'
          : { pendente: 'Nenhum cadastro aguardando aprovação', aprovado: 'Nenhum sócio aprovado', inativo: 'Nenhum sócio inativo' }[grupo]
      "
      :descricao="busca ? 'Tente outro nome, e-mail ou telefone.' : undefined"
    />

    <ul v-else class="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
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
