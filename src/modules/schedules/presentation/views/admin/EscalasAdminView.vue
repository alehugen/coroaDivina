<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { hojeISO } from '@/shared/lib/datas'
import {
  BaseAlert,
  BaseButton,
  BaseSpinner,
  EmptyState,
  ProgressBar,
  SegmentedControl,
} from '@/shared/ui'
import { escalas } from '../../..'
import { percentual, rotuloPeriodo, type Escala, type EscalaComResumo } from '../../../domain/Escala'
import DuplicarEscalaModal from '../../components/DuplicarEscalaModal.vue'
import StatusBadge from '../../components/StatusBadge.vue'

type Filtro = 'atuais' | 'passadas' | 'arquivadas'

const lista = ref<EscalaComResumo[]>([])
const carregando = ref(true)
const erro = ref('')
const filtro = ref<Filtro>('atuais')

onMounted(async () => {
  const r = await escalas.listar()
  carregando.value = false
  if (r.ok) lista.value = r.value
  else erro.value = r.error
})

const hoje = hojeISO()
const grupoDe = (e: Escala): Filtro =>
  e.status === 'arquivada' ? 'arquivadas' : e.dataFim < hoje ? 'passadas' : 'atuais'

const contagem = computed(() => {
  const c: Record<Filtro, number> = { atuais: 0, passadas: 0, arquivadas: 0 }
  for (const e of lista.value) c[grupoDe(e)]++
  return c
})

const opcoes = computed(() => [
  { value: 'atuais' as const, label: 'Atuais e próximas', contador: contagem.value.atuais },
  { value: 'passadas' as const, label: 'Passadas', contador: contagem.value.passadas },
  { value: 'arquivadas' as const, label: 'Arquivadas', contador: contagem.value.arquivadas },
])

const visiveis = computed(() => {
  const l = lista.value.filter((e) => grupoDe(e) === filtro.value)
  // atuais: a mais próxima primeiro; demais: mais recente primeiro
  return filtro.value === 'atuais' ? [...l].sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)) : l
})

const modalDuplicar = ref(false)
const origem = ref<Escala | null>(null)
function duplicar(e: Escala) {
  origem.value = e
  modalDuplicar.value = true
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SegmentedControl v-model="filtro" :opcoes="opcoes" rotulo="Filtrar escalas" />
      <BaseButton to="/admin/escalas/nova" class="shrink-0">+ Nova escala</BaseButton>
    </div>

    <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>

    <div v-if="carregando" class="flex justify-center py-12 text-primary">
      <BaseSpinner class="size-6" />
    </div>

    <EmptyState
      v-else-if="!visiveis.length"
      :titulo="filtro === 'atuais' ? 'Nenhuma escala atual ou próxima' : 'Nada por aqui'"
      :descricao="filtro === 'atuais' ? 'Crie uma nova escala ou duplique uma anterior.' : undefined"
    />

    <ul v-else class="grid gap-3 md:grid-cols-2">
      <li
        v-for="e in visiveis"
        :key="e.id"
        class="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/40"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <RouterLink
              :to="`/admin/escalas/${e.id}`"
              class="font-semibold text-text hover:text-primary hover:underline"
            >
              {{ e.titulo }}
            </RouterLink>
            <p class="mt-0.5 text-sm text-muted">
              {{ rotuloPeriodo(e.dataInicio, e.dataFim) }} · {{ e.resumo.dias }}
              {{ e.resumo.dias === 1 ? 'dia' : 'dias' }}
            </p>
          </div>
          <StatusBadge :status="e.status" />
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between text-sm">
            <span class="text-muted">Vagas preenchidas</span>
            <span class="font-medium text-text">{{ e.resumo.ocupadas }} / {{ e.resumo.vagas }}</span>
          </div>
          <ProgressBar
            :valor="percentual(e.resumo.ocupadas, e.resumo.vagas)"
            :rotulo="`${e.resumo.ocupadas} de ${e.resumo.vagas} vagas preenchidas`"
          />
        </div>

        <div class="flex gap-2">
          <BaseButton size="sm" variant="secondary" :to="`/admin/escalas/${e.id}`">Gerenciar</BaseButton>
          <BaseButton size="sm" variant="ghost" @click="duplicar(e)">Duplicar</BaseButton>
        </div>
      </li>
    </ul>

    <DuplicarEscalaModal v-model="modalDuplicar" :origem="origem" />
  </section>
</template>
