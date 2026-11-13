<script setup lang="ts">
import {
  PhArrowLeft,
  PhCalendarX,
  PhCopy,
  PhCrown,
  PhDotsThreeVertical,
  PhEye,
  PhPencilSimple,
  PhPlus,
  PhTrash,
  PhWarningCircle,
} from '@phosphor-icons/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { confirmar } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import { EmptyState } from '@/shared/ui'
import { escalas } from '../../..'
import { rotuloPeriodo, STATUS_INFO, TRANSICOES, type Transicao } from '../../../domain/Escala'
import DiasTabs from '../../components/DiasTabs.vue'
import AdicionarDiaDialog from '../../components/admin/AdicionarDiaDialog.vue'
import DiaPainel from '../../components/admin/DiaPainel.vue'
import EditarEscalaDialog from '../../components/admin/EditarEscalaDialog.vue'
import DuplicarEscalaDialog from '../../components/DuplicarEscalaDialog.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { useEscalaAtualStore } from '../../stores/escalaAtual'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useEscalaAtualStore()

watch(
  () => props.id,
  (id) => store.carregar(id),
  { immediate: true },
)

onMounted(store.observar)
onUnmounted(store.pararDeObservar)

// --- dia selecionado
const diaId = ref<string | null>(null)
const dias = computed(() => store.escala?.dias ?? [])
const dia = computed(() => dias.value.find((d) => d.id === diaId.value) ?? dias.value[0] ?? null)
const diaSelecionado = computed({
  get: () => dia.value?.id ?? null,
  set: (v) => (diaId.value = v),
})

function selecionarPorData(data: string) {
  diaId.value = dias.value.find((d) => d.data === data)?.id ?? null
}

// --- status
const MENSAGENS: Partial<Record<string, { titulo: string; mensagem: string }>> = {
  aberta: {
    titulo: 'Abrir inscrições?',
    mensagem: 'A escala ficará visível para todos os sócios aprovados, que poderão se inscrever nas vagas livres.',
  },
  fechada: {
    titulo: 'Encerrar inscrições?',
    mensagem: 'Os sócios continuarão vendo a escala, mas não poderão se inscrever nem cancelar.',
  },
  arquivada: {
    titulo: 'Arquivar escala?',
    mensagem: 'Ela sai das listas dos sócios. Você pode desarquivar depois.',
  },
}

async function mudarStatus(t: Transicao) {
  if (!store.escala) return
  const msg = MENSAGENS[t.para]
  if (msg && !(await confirmar({ ...msg, confirmar: t.rotulo }))) return
  await store.executar(() => escalas.alterarStatus(store.escala!.id, t.para), `Status: ${STATUS_INFO[t.para].rotulo}.`)
}

async function excluir() {
  if (!store.escala) return
  const n = store.totalInscricoes
  const ok = await confirmar({
    titulo: `Excluir "${store.escala.titulo}"?`,
    mensagem: n
      ? `Todos os dias, funções e as ${n} inscrição(ões) serão apagados. Essa ação não pode ser desfeita.`
      : 'Todos os dias e funções serão apagados. Essa ação não pode ser desfeita.',
    confirmar: 'Excluir escala',
    tom: 'danger',
  })
  if (!ok) return
  const r = await escalas.excluir(store.escala.id)
  if (!r.ok) return toast(r.error, 'danger')
  toast('Escala excluída.')
  router.replace('/admin/escalas')
}

const modalEditar = ref(false)
const modalDuplicar = ref(false)
const modalDia = ref(false)
</script>

<template>
  <div class="flex flex-col gap-6">
    <Button as-child variant="ghost" class="-ml-2 self-start text-muted-foreground">
      <RouterLink to="/admin/escalas"><PhArrowLeft /> Escalas</RouterLink>
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
      descricao="Ela pode ter sido excluída."
    />

    <template v-else-if="store.escala">
      <!-- Cabeçalho -->
      <header class="-mt-4 flex flex-col gap-4 rounded-xl border bg-card p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-semibold">{{ store.escala.titulo }}</h2>
              <StatusBadge :status="store.escala.status" />
            </div>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ rotuloPeriodo(store.escala.dataInicio, store.escala.dataFim) }}
            </p>
            <p v-if="store.orgas" class="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <PhCrown class="size-4 text-highlight" weight="fill" /> Orgã: {{ store.orgas }}
            </p>
            <p v-if="store.escala.descricao" class="mt-2 text-sm whitespace-pre-line">{{ store.escala.descricao }}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon-lg" aria-label="Mais ações">
                <PhDotsThreeVertical class="size-5" weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="router.push(`/escalas/${store.escala.id}`)">
                <PhEye /> Ver como sócio
              </DropdownMenuItem>
              <DropdownMenuItem @select="modalEditar = true"><PhPencilSimple /> Editar título e descrição</DropdownMenuItem>
              <DropdownMenuItem @select="modalDuplicar = true"><PhCopy /> Duplicar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="excluir"><PhTrash /> Excluir escala</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div class="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-muted-foreground">{{ STATUS_INFO[store.escala.status].descricao }}</p>
          <div class="flex shrink-0 flex-wrap gap-2">
            <Button
              v-for="t in TRANSICOES[store.escala.status]"
              :key="t.para"
              size="lg"
              :variant="t.principal ? 'default' : 'outline'"
              @click="mudarStatus(t)"
            >
              {{ t.rotulo }}
            </Button>
          </div>
        </div>
      </header>

      <!-- Dias -->
      <DiasTabs v-model="diaSelecionado" :dias="dias">
        <Button variant="outline" class="h-auto shrink-0 border-dashed px-4 text-muted-foreground" @click="modalDia = true">
          <PhPlus /> Dia
        </Button>
      </DiasTabs>

      <DiaPainel v-if="dia" :key="dia.id" :dia="dia" :unico-dia="dias.length === 1" @removido="diaId = null" />

      <EditarEscalaDialog v-model="modalEditar" />
      <DuplicarEscalaDialog v-model="modalDuplicar" :origem="store.escala" />
      <AdicionarDiaDialog v-model="modalDia" @adicionado="selecionarPorData" />
    </template>
  </div>
</template>
