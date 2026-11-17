<script setup lang="ts">
import { PhCalendarPlus, PhCopy, PhPlus, PhWarningCircle } from '@phosphor-icons/vue'
import { computed, onMounted, ref } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { hojeISO } from '@/shared/lib/datas'
import { CarregandoConteudo, EmptyState } from '@/shared/ui'
import { escalas } from '../../..'
import { percentual, rotuloPeriodo, type Escala, type EscalaComResumo } from '../../../domain/Escala'
import DuplicarEscalaDialog from '../../components/DuplicarEscalaDialog.vue'
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
      <Tabs v-model="filtro" class="max-w-full overflow-x-auto">
        <TabsList class="h-11!">
          <TabsTrigger v-for="o in opcoes" :key="o.value" :value="o.value" class="gap-1.5 px-3">
            {{ o.label }}
            <span class="text-xs text-muted-foreground tabular-nums">{{ o.contador }}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Button as-child size="lg" class="shrink-0">
        <RouterLink to="/admin/escalas/nova"><PhPlus /> Nova escala</RouterLink>
      </Button>
    </div>

    <Alert v-if="erro" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ erro }}</AlertDescription>
    </Alert>

    <CarregandoConteudo v-if="carregando" forma="cards" />

    <EmptyState
      v-else-if="!visiveis.length"
      :icone="PhCalendarPlus"
      :titulo="filtro === 'atuais' ? 'Nenhuma escala atual ou próxima' : 'Nada por aqui'"
      :descricao="filtro === 'atuais' ? 'Crie uma nova escala ou duplique uma anterior.' : undefined"
    >
      <Button v-if="filtro === 'atuais'" as-child>
        <RouterLink to="/admin/escalas/nova"><PhPlus /> Nova escala</RouterLink>
      </Button>
    </EmptyState>

    <ul v-else class="grid gap-3 md:grid-cols-2">
      <li v-for="e in visiveis" :key="e.id">
        <Card class="h-full">
          <CardHeader>
            <CardTitle>
              <RouterLink :to="`/admin/escalas/${e.id}`" class="hover:text-primary hover:underline">
                {{ e.titulo }}
              </RouterLink>
            </CardTitle>
            <CardDescription>
              {{ rotuloPeriodo(e.dataInicio, e.dataFim) }} · {{ e.resumo.dias }} {{ e.resumo.dias === 1 ? 'dia' : 'dias' }}
            </CardDescription>
            <CardAction><StatusBadge :status="e.status" /></CardAction>
          </CardHeader>
          <CardContent class="flex flex-col gap-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Vagas preenchidas</span>
              <span class="font-medium tabular-nums">{{ e.resumo.ocupadas }} / {{ e.resumo.vagas }}</span>
            </div>
            <Progress
              :model-value="percentual(e.resumo.ocupadas, e.resumo.vagas)"
              class="h-2"
              :aria-label="`${e.resumo.ocupadas} de ${e.resumo.vagas} vagas preenchidas`"
            />
          </CardContent>
          <CardFooter class="gap-2 border-t pt-4 pb-4">
            <Button as-child variant="outline">
              <RouterLink :to="`/admin/escalas/${e.id}`">Gerenciar</RouterLink>
            </Button>
            <Button variant="ghost" @click="duplicar(e)"><PhCopy /> Duplicar</Button>
          </CardFooter>
        </Card>
      </li>
    </ul>

    <DuplicarEscalaDialog v-model="modalDuplicar" :origem="origem" />
  </section>
</template>
