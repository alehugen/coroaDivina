<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { confirmar } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import { BaseButton, BaseTextarea } from '@/shared/ui'
import { escalas } from '../../..'
import { funcoesPorArea, ocupacao, rotuloDia, type DiaEscala } from '../../../domain/Escala'
import { useEscalaEditorStore } from '../../stores/escalaEditor'
import AdicionarFuncaoModal from './AdicionarFuncaoModal.vue'
import FuncaoDiaLinha from './FuncaoDiaLinha.vue'

const props = defineProps<{ dia: DiaEscala; unicoDia: boolean }>()
const emit = defineEmits<{ removido: [] }>()
const store = useEscalaEditorStore()

const grupos = computed(() => funcoesPorArea(props.dia.funcoes))
const totais = computed(() =>
  props.dia.funcoes
    .filter((f) => f.ativa)
    .reduce(
      (t, f) => {
        const o = ocupacao(f)
        return { ocupadas: t.ocupadas + o.total, vagas: t.vagas + o.vagas }
      },
      { ocupadas: 0, vagas: 0 },
    ),
)

// --- observações (salva ao sair do campo)
const observacoes = ref(props.dia.observacoes)
watch(
  () => props.dia,
  (d) => (observacoes.value = d.observacoes),
)

async function salvarObservacoes() {
  if (observacoes.value.trim() === props.dia.observacoes.trim()) return
  const r = await escalas.salvarObservacoes(props.dia.id, observacoes.value)
  if (!r.ok) return toast(r.error, 'danger')
  toast('Observações salvas.')
  await store.recarregar()
}

// --- remover dia
async function removerDia() {
  const ok = await confirmar({
    titulo: `Remover ${rotuloDia(props.dia.data)} da escala?`,
    mensagem: totais.value.ocupadas
      ? `Todas as funções e as ${totais.value.ocupadas} inscrição(ões) desse dia serão removidas.`
      : 'Todas as funções desse dia serão removidas.',
    confirmar: 'Remover dia',
    tom: 'danger',
  })
  if (!ok) return
  const sucesso = await store.executar(() => escalas.removerDia(props.dia.id), 'Dia removido.')
  if (sucesso) emit('removido')
}

const modalFuncao = ref(false)
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold text-text">{{ rotuloDia(dia.data) }}</h3>
        <p class="text-sm text-muted">
          {{ totais.ocupadas }} de {{ totais.vagas }} vagas preenchidas
        </p>
      </div>
      <div class="flex gap-2">
        <BaseButton size="sm" variant="secondary" @click="modalFuncao = true">+ Função</BaseButton>
        <BaseButton
          v-if="!unicoDia"
          size="sm"
          variant="ghost"
          class="text-danger"
          @click="removerDia"
        >
          Remover dia
        </BaseButton>
      </div>
    </div>

    <article
      v-for="g in grupos"
      :key="g.area.id"
      class="overflow-hidden rounded-xl border border-border bg-surface"
    >
      <header
        class="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-semibold text-text sm:px-5"
        :style="{ boxShadow: `inset 4px 0 0 ${g.area.cor}` }"
      >
        <span class="size-2.5 rounded-full" :style="{ backgroundColor: g.area.cor }" aria-hidden="true" />
        {{ g.area.nome }}
      </header>
      <ul class="divide-y divide-border">
        <FuncaoDiaLinha v-for="f in g.funcoes" :key="f.id" :funcao="f" />
      </ul>
    </article>

    <p v-if="!dia.funcoes.length" class="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
      Nenhuma função neste dia.
    </p>

    <div class="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <BaseTextarea
        v-model="observacoes"
        label="Observações do dia"
        placeholder="Ex.: Jantar com sopa para 80 pessoas. Trazer panelas grandes."
        hint="Visível para os sócios na grade. Salva ao sair do campo."
        @blur="salvarObservacoes"
      />
    </div>

    <AdicionarFuncaoModal v-model="modalFuncao" :dia="dia" />
  </section>
</template>
