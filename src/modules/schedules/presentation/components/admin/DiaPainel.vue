<script setup lang="ts">
import { PhPlus, PhTrash } from '@phosphor-icons/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { confirmar } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import { FormTextarea } from '@/shared/ui'
import { escalas } from '../../..'
import { funcoesPorArea, ocupacao, rotuloDia, type DiaEscala } from '../../../domain/Escala'
import { useEscalaAtualStore } from '../../stores/escalaAtual'
import AdicionarFuncaoDialog from './AdicionarFuncaoDialog.vue'
import FuncaoDiaLinha from './FuncaoDiaLinha.vue'

const props = defineProps<{ dia: DiaEscala; unicoDia: boolean }>()
const emit = defineEmits<{ removido: [] }>()
const store = useEscalaAtualStore()

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
        <h3 class="text-lg font-semibold">{{ rotuloDia(dia.data) }}</h3>
        <p class="text-sm text-muted-foreground">{{ totais.ocupadas }} de {{ totais.vagas }} vagas preenchidas</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="lg" @click="modalFuncao = true"><PhPlus /> Função</Button>
        <Button v-if="!unicoDia" variant="destructive" size="lg" @click="removerDia"><PhTrash /> Remover dia</Button>
      </div>
    </div>

    <article v-for="g in grupos" :key="g.area.id" class="overflow-hidden rounded-xl border bg-card">
      <header
        class="flex items-center gap-2 border-b px-4 py-2.5 text-sm font-semibold sm:px-5"
        :style="{ boxShadow: `inset 4px 0 0 ${g.area.cor}` }"
      >
        <span class="size-2.5 rounded-full" :style="{ backgroundColor: g.area.cor }" aria-hidden="true" />
        {{ g.area.nome }}
      </header>
      <ul class="divide-y">
        <FuncaoDiaLinha v-for="f in g.funcoes" :key="f.id" :funcao="f" />
      </ul>
    </article>

    <p v-if="!dia.funcoes.length" class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      Nenhuma função neste dia.
    </p>

    <Card>
      <CardContent>
        <FormTextarea
          v-model="observacoes"
          label="Observações do dia"
          placeholder="Ex.: Jantar com sopa para 80 pessoas. Trazer panelas grandes."
          hint="Visível para os sócios na grade. Salva ao sair do campo."
          @blur="salvarObservacoes"
        />
      </CardContent>
    </Card>

    <AdicionarFuncaoDialog v-model="modalFuncao" :dia="dia" />
  </section>
</template>
