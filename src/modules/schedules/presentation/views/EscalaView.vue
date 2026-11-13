<script setup lang="ts">
import {
  PhArrowLeft,
  PhCalendarX,
  PhCrown,
  PhGearSix,
  PhInfo,
  PhLockSimple,
  PhPencilRuler,
  PhPrinter,
  PhWarningCircle,
} from '@phosphor-icons/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useSessionStore } from '@/modules/identity'
import { confirmar } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import { hojeISO } from '@/shared/lib/datas'
import { EmptyState } from '@/shared/ui'
import { escalas } from '../..'
import { funcoesPorArea, rotuloDia, rotuloPeriodo, type FuncaoDoDia, type Inscricao, type Papel } from '../../domain/Escala'
import { ROTULO_PAPEL, type ContextoInscricao } from '../../domain/Inscricao'
import DiasTabs from '../components/DiasTabs.vue'
import FuncaoInscricaoItem from '../components/FuncaoInscricaoItem.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useEscalaAtualStore } from '../stores/escalaAtual'

const props = defineProps<{ id: string }>()
const store = useEscalaAtualStore()
const session = useSessionStore()
const hoje = hojeISO()

watch(
  () => props.id,
  (id) => store.carregar(id),
  { immediate: true },
)
onMounted(store.observar)
onUnmounted(store.pararDeObservar)

const meuId = computed(() => session.conta?.id ?? '')
const dias = computed(() => store.escala?.dias ?? [])

// Abre no dia pedido pela URL (?dia=AAAA-MM-DD, vindo do calendário) ou no primeiro dia a partir de hoje
const route = useRoute()
const diaDaUrl = typeof route.query.dia === 'string' ? route.query.dia : null
const diaId = ref<string | null>(null)
const dia = computed(
  () =>
    dias.value.find((d) => d.id === diaId.value) ??
    dias.value.find((d) => d.data === diaDaUrl) ??
    dias.value.find((d) => d.data >= hoje) ??
    dias.value[0] ??
    null,
)
const diaSelecionado = computed({
  get: () => dia.value?.id ?? null,
  set: (v) => (diaId.value = v),
})

const grupos = computed(() => (dia.value ? funcoesPorArea(dia.value.funcoes.filter((f) => f.ativa)) : []))

const ctx = computed<ContextoInscricao | null>(() =>
  store.escala && dia.value
    ? { status: store.escala.status, data: dia.value.data, hoje, meuId: meuId.value, gestor: session.gestor }
    : null,
)

const minhasNaEscala = computed(
  () => dias.value.flatMap((d) => d.funcoes.filter((f) => f.inscricoes.some((i) => i.profileId === meuId.value))).length,
)

// --- ações
const ocupado = ref<{ funcaoId: string; acao: Papel | 'cancelando' } | null>(null)

async function inscrever(f: FuncaoDoDia, papel: Papel) {
  ocupado.value = { funcaoId: f.id, acao: papel }
  const r = await escalas.inscrever(f.id, papel)
  ocupado.value = null
  if (!r.ok) toast(r.error, 'danger')
  else toast(`Você entrou em ${f.nome} como ${ROTULO_PAPEL[papel]}.`)
  await store.recarregar()
}

async function cancelar(f: FuncaoDoDia, i: Inscricao) {
  const ok = await confirmar({
    titulo: `Sair de ${f.nome}?`,
    mensagem: `Sua vaga de ${ROTULO_PAPEL[i.papel]} ficará livre para outra pessoa e a Orgã será avisada por e-mail.`,
    confirmar: 'Sair da função',
    cancelar: 'Continuar inscrito(a)',
    tom: 'danger',
  })
  if (!ok) return
  ocupado.value = { funcaoId: f.id, acao: 'cancelando' }
  const r = await escalas.cancelarInscricao(i.id)
  ocupado.value = null
  if (!r.ok) toast(r.error, 'danger')
  else toast(`Você saiu de ${f.nome}.`)
  await store.recarregar()
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <Button as-child variant="ghost" class="-ml-2 self-start text-muted-foreground">
      <RouterLink to="/escalas"><PhArrowLeft /> Escalas</RouterLink>
    </Button>

    <div v-if="store.carregando && !store.escala" class="flex justify-center py-12 text-primary">
      <Spinner class="size-6" />
    </div>

    <Alert v-else-if="store.erro && !store.escala" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ store.erro }}</AlertDescription>
    </Alert>

    <EmptyState
      v-else-if="store.naoEncontrada"
      :icone="PhCalendarX"
      titulo="Escala não encontrada"
      descricao="Ela pode ter sido encerrada ou ainda não foi aberta."
    />

    <template v-else-if="store.escala">
      <!-- Cabeçalho -->
      <header class="-mt-3 flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-bold">{{ store.escala.titulo }}</h1>
              <StatusBadge :status="store.escala.status" />
            </div>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ rotuloPeriodo(store.escala.dataInicio, store.escala.dataFim) }}
              <template v-if="minhasNaEscala">
                · você está em <strong class="text-foreground">{{ minhasNaEscala }}</strong>
                {{ minhasNaEscala === 1 ? 'função' : 'funções' }}
              </template>
            </p>
            <p v-if="store.orgas" class="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <PhCrown class="size-4 text-highlight" weight="fill" /> Orgã: {{ store.orgas }}
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap justify-end gap-2">
            <Button as-child variant="outline">
              <RouterLink :to="`/escalas/${store.escala.id}/imprimir`"><PhPrinter /> Imprimir / WhatsApp</RouterLink>
            </Button>
            <Button v-if="session.gestor" as-child variant="outline">
              <RouterLink :to="`/admin/escalas/${store.escala.id}`"><PhGearSix /> Gerenciar</RouterLink>
            </Button>
          </div>
        </div>
        <p v-if="store.escala.descricao" class="text-sm whitespace-pre-line">{{ store.escala.descricao }}</p>

        <Alert v-if="store.escala.status === 'rascunho'" class="border-warning/40 bg-warning-soft">
          <PhPencilRuler class="text-warning" />
          <AlertTitle>Escala em preparação</AlertTitle>
          <AlertDescription class="text-foreground">
            <template v-if="session.gestor">
              Todos já veem esta escala, mas só podem se inscrever depois que você abrir as inscrições em
              “Gerenciar”.
            </template>
            <template v-else>As inscrições ainda não foram abertas. Você poderá escolher suas funções em breve.</template>
          </AlertDescription>
        </Alert>
        <Alert v-else-if="store.escala.status === 'arquivada'">
          <PhLockSimple />
          <AlertTitle>Escala arquivada</AlertTitle>
          <AlertDescription>Disponível só para consulta.</AlertDescription>
        </Alert>
        <Alert v-else-if="store.escala.status === 'fechada'">
          <PhLockSimple />
          <AlertTitle>Inscrições encerradas</AlertTitle>
          <AlertDescription>A escala está fechada para novas inscrições e cancelamentos.</AlertDescription>
        </Alert>
      </header>

      <DiasTabs v-model="diaSelecionado" :dias="dias" :meu-id="meuId" />

      <section v-if="dia && ctx" class="flex flex-col gap-4">
        <h2 class="text-lg font-semibold">{{ rotuloDia(dia.data) }}</h2>

        <Alert v-if="dia.observacoes">
          <PhInfo />
          <AlertTitle>Observações do dia</AlertTitle>
          <AlertDescription class="whitespace-pre-line">{{ dia.observacoes }}</AlertDescription>
        </Alert>

        <article v-for="g in grupos" :key="g.area.id" class="overflow-hidden rounded-xl border bg-card">
          <header
            class="flex items-center gap-2 border-b px-4 py-2.5 text-sm font-semibold sm:px-5"
            :style="{ boxShadow: `inset 4px 0 0 ${g.area.cor}` }"
          >
            <span class="size-2.5 rounded-full" :style="{ backgroundColor: g.area.cor }" aria-hidden="true" />
            {{ g.area.nome }}
          </header>
          <ul class="divide-y">
            <FuncaoInscricaoItem
              v-for="f in g.funcoes"
              :key="f.id"
              :funcao="f"
              :ctx="ctx"
              :ocupado="ocupado?.funcaoId === f.id ? ocupado.acao : null"
              @inscrever="inscrever(f, $event)"
              @cancelar="cancelar(f, $event)"
            />
          </ul>
        </article>

        <EmptyState v-if="!grupos.length" :icone="PhCalendarX" titulo="Nenhuma função disponível neste dia" />
      </section>
    </template>
  </div>
</template>
