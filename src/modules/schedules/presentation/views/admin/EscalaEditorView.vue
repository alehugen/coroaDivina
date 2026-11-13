<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { confirmar } from '@/shared/composables/useConfirm'
import { BaseAlert, BaseButton, BaseSpinner, EmptyState } from '@/shared/ui'
import { escalas } from '../../..'
import {
  ocupacao,
  rotuloDiaCurto,
  rotuloPeriodo,
  STATUS_INFO,
  TRANSICOES,
  type Transicao,
} from '../../../domain/Escala'
import AdicionarDiaModal from '../../components/admin/AdicionarDiaModal.vue'
import DiaPainel from '../../components/admin/DiaPainel.vue'
import EditarEscalaModal from '../../components/admin/EditarEscalaModal.vue'
import DuplicarEscalaModal from '../../components/DuplicarEscalaModal.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { useEscalaEditorStore } from '../../stores/escalaEditor'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useEscalaEditorStore()

watch(() => props.id, (id) => store.carregar(id), { immediate: true })

// --- dia selecionado
const diaId = ref<string | null>(null)
const dias = computed(() => store.escala?.dias ?? [])
const dia = computed(() => dias.value.find((d) => d.id === diaId.value) ?? dias.value[0] ?? null)

function preenchimentoDia(d: (typeof dias.value)[number]) {
  const ativas = d.funcoes.filter((f) => f.ativa).map(ocupacao)
  const vagas = ativas.reduce((n, o) => n + o.vagas, 0)
  const ocupadas = ativas.reduce((n, o) => n + o.total, 0)
  return { vagas, ocupadas, completo: vagas > 0 && ocupadas >= vagas }
}

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
  if (r.ok) router.replace('/admin/escalas')
  else await store.executar(async () => r)
}

const modalEditar = ref(false)
const modalDuplicar = ref(false)
const modalDia = ref(false)
</script>

<template>
  <div class="flex flex-col gap-6">
    <RouterLink to="/admin/escalas" class="text-sm text-muted hover:text-text">← Escalas</RouterLink>

    <div v-if="store.carregando && !store.escala" class="flex justify-center py-12 text-primary">
      <BaseSpinner class="size-6" />
    </div>

    <BaseAlert v-else-if="store.erro && !store.escala" tone="danger">{{ store.erro }}</BaseAlert>

    <EmptyState
      v-else-if="store.naoEncontrada"
      titulo="Escala não encontrada"
      descricao="Ela pode ter sido excluída."
    />

    <template v-else-if="store.escala">
      <!-- Cabeçalho -->
      <header class="-mt-3 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-semibold text-text">{{ store.escala.titulo }}</h2>
              <StatusBadge :status="store.escala.status" />
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ rotuloPeriodo(store.escala.dataInicio, store.escala.dataFim) }}
              <template v-if="store.orgas"> · Orgã: {{ store.orgas }}</template>
            </p>
            <p v-if="store.escala.descricao" class="mt-2 whitespace-pre-line text-sm text-text">
              {{ store.escala.descricao }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <BaseButton size="sm" variant="ghost" @click="modalEditar = true">Editar</BaseButton>
            <BaseButton size="sm" variant="ghost" @click="modalDuplicar = true">Duplicar</BaseButton>
            <BaseButton size="sm" variant="ghost" class="text-danger" @click="excluir">Excluir</BaseButton>
          </div>
        </div>

        <div class="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-muted">{{ STATUS_INFO[store.escala.status].descricao }}</p>
          <div class="flex shrink-0 flex-wrap gap-2">
            <BaseButton
              v-for="t in TRANSICOES[store.escala.status]"
              :key="t.para"
              size="sm"
              :variant="t.principal ? 'primary' : 'secondary'"
              @click="mudarStatus(t)"
            >
              {{ t.rotulo }}
            </BaseButton>
          </div>
        </div>
      </header>

      <!-- Dias -->
      <nav class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Dias da escala">
        <button
          v-for="d in dias"
          :key="d.id"
          type="button"
          class="flex shrink-0 flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors"
          :class="
            dia?.id === d.id
              ? 'border-primary bg-primary-soft'
              : 'border-border bg-surface hover:border-primary/40'
          "
          :aria-current="dia?.id === d.id ? 'page' : undefined"
          @click="diaId = d.id"
        >
          <span class="text-sm font-semibold text-text">{{ rotuloDiaCurto(d.data) }}</span>
          <span
            class="text-xs"
            :class="preenchimentoDia(d).completo ? 'font-medium text-success' : 'text-muted'"
          >
            {{ preenchimentoDia(d).ocupadas }}/{{ preenchimentoDia(d).vagas }}
          </span>
        </button>
        <button
          type="button"
          class="shrink-0 rounded-lg border border-dashed border-border px-4 text-sm font-medium text-muted hover:border-primary hover:text-primary"
          @click="modalDia = true"
        >
          + Dia
        </button>
      </nav>

      <DiaPainel
        v-if="dia"
        :key="dia.id"
        :dia="dia"
        :unico-dia="dias.length === 1"
        @removido="diaId = null"
      />

      <EditarEscalaModal v-model="modalEditar" />
      <DuplicarEscalaModal v-model="modalDuplicar" :origem="store.escala" />
      <AdicionarDiaModal v-model="modalDia" @adicionado="selecionarPorData" />
    </template>
  </div>
</template>
