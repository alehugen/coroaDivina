<script setup lang="ts">
import { PhArrowRight, PhCaretDown, PhStar, PhWarningCircle } from '@phosphor-icons/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { hojeISO } from '@/shared/lib/datas'
import { CarregandoConteudo, EmptyState } from '@/shared/ui'
import { escalas } from '../..'
import { rotuloDia } from '../../domain/Escala'
import { agruparPorData, ROTULO_PAPEL, type MinhaInscricao } from '../../domain/Inscricao'
import ProximoCompromisso from '../components/ProximoCompromisso.vue'

const lista = ref<MinhaInscricao[]>([])
const carregando = ref(true)
const erro = ref('')
const hoje = hojeISO()

async function carregar() {
  const r = await escalas.minhasInscricoes()
  carregando.value = false
  erro.value = r.ok ? '' : r.error
  if (r.ok) lista.value = r.value
}

// Atualiza ao vivo (ex.: a Orgã incluiu/removeu você)
let parar: (() => void) | undefined
onMounted(() => {
  carregar()
  parar = escalas.observarInscricoes(carregar)
})
onUnmounted(() => parar?.())

const grupos = computed(() => agruparPorData(lista.value, hoje))
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Minhas escalas</h1>

    <Alert v-if="erro" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ erro }}</AlertDescription>
    </Alert>

    <CarregandoConteudo v-if="carregando" forma="lista" />

    <EmptyState
      v-else-if="!grupos.proximas.length"
      coroa
      titulo="Você não tem funções nos próximos dias"
      descricao="Escolha um lugar livre numa escala aberta e ele aparece aqui."
    >
      <Button as-child>
        <RouterLink to="/escalas">Ver escalas <PhArrowRight data-icon="inline-end" /></RouterLink>
      </Button>
    </EmptyState>

    <ProximoCompromisso
      v-if="!carregando && grupos.proximas[0]"
      :data="grupos.proximas[0].data"
      :itens="grupos.proximas[0].itens"
      :hoje="hoje"
    />

    <h2 v-if="!carregando && grupos.proximas.length > 1" class="-mb-2 text-sm font-semibold text-muted-foreground">
      Depois
    </h2>
    <ol v-if="!carregando && grupos.proximas.length > 1" class="flex flex-col gap-4">
      <li v-for="g in grupos.proximas.slice(1)" :key="g.data" class="overflow-hidden rounded-xl border bg-card">
        <h2 class="flex items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2.5 font-semibold sm:px-5">
          {{ rotuloDia(g.data) }}
          <Badge v-if="g.data === hoje" class="bg-highlight text-highlight-foreground">Hoje</Badge>
        </h2>
        <ul class="divide-y">
          <li v-for="i in g.itens" :key="i.id">
            <RouterLink
              :to="`/escalas/${i.escalaId}`"
              class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-5"
            >
              <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: i.areaCor }" aria-hidden="true" />
              <span class="min-w-0 flex-1">
                <span class="block font-medium">{{ i.funcao }}</span>
                <span class="block truncate text-xs text-muted-foreground">{{ i.area }} · {{ i.escala }}</span>
              </span>
              <Badge :class="i.papel === 'responsavel' ? 'bg-accent text-accent-foreground' : ''" :variant="i.papel === 'responsavel' ? 'default' : 'secondary'">
                <PhStar v-if="i.papel === 'responsavel'" weight="fill" data-icon="inline-start" />
                {{ ROTULO_PAPEL[i.papel] }}
              </Badge>
              <PhArrowRight class="size-4 text-muted-foreground" />
            </RouterLink>
          </li>
        </ul>
      </li>
    </ol>

    <details v-if="grupos.anteriores.length" class="group">
      <summary class="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground">
        <PhCaretDown class="size-4 transition-transform group-open:rotate-180" />
        Anteriores ({{ grupos.anteriores.reduce((n, g) => n + g.itens.length, 0) }})
      </summary>
      <ul class="mt-3 divide-y overflow-hidden rounded-xl border bg-card opacity-80">
        <template v-for="g in grupos.anteriores" :key="g.data">
          <li v-for="i in g.itens" :key="i.id" class="flex items-center gap-3 px-4 py-2.5 text-sm sm:px-5">
            <span class="w-28 shrink-0 text-muted-foreground">{{ rotuloDia(g.data).split(' | ')[1] }}</span>
            <span class="min-w-0 flex-1 truncate">{{ i.funcao }}</span>
            <span class="text-xs text-muted-foreground">{{ ROTULO_PAPEL[i.papel] }}</span>
          </li>
        </template>
      </ul>
    </details>
  </div>
</template>
