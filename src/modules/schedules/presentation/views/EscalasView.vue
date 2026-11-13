<script setup lang="ts">
import { PhArrowRight, PhCalendarBlank, PhListBullets, PhWarningCircle, PhCalendarDots } from '@phosphor-icons/vue'
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { hojeISO, type DataISO } from '@/shared/lib/datas'
import { EmptyState } from '@/shared/ui'
import { escalas } from '../..'
import { eventosPorData } from '../../domain/Calendario'
import { percentual, rotuloPeriodo, type EscalaComResumo } from '../../domain/Escala'
import type { MinhaInscricao } from '../../domain/Inscricao'
import CalendarioEscalas from '../components/CalendarioEscalas.vue'
import StatusBadge from '../components/StatusBadge.vue'

const lista = ref<EscalaComResumo[]>([])
const dias = ref<{ escalaId: string; data: DataISO }[]>([])
const minhas = ref<MinhaInscricao[]>([])
const carregando = ref(true)
const erro = ref('')
const hoje = hojeISO()

/** Lista ou calendário — lembrado neste aparelho. */
const modo = useLocalStorage<'lista' | 'calendario'>('escalas-modo', 'lista')

onMounted(async () => {
  const [l, d, m] = await Promise.all([escalas.listar(), escalas.listarDias(), escalas.minhasInscricoes()])
  carregando.value = false
  if (l.ok) lista.value = l.value
  else erro.value = l.error
  if (d.ok) dias.value = d.value
  if (m.ok) minhas.value = m.value
})

// Todas as escalas são visíveis para todos; o status só limita as ações.
type Filtro = 'atuais' | 'anteriores'
const filtro = ref<Filtro>('atuais')
const ehAnterior = (e: EscalaComResumo) => e.status === 'arquivada' || e.dataFim < hoje

const atuais = computed(() =>
  lista.value.filter((e) => !ehAnterior(e)).sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
)
const anteriores = computed(() =>
  lista.value.filter(ehAnterior).sort((a, b) => b.dataInicio.localeCompare(a.dataInicio)),
)
const visiveis = computed(() => (filtro.value === 'atuais' ? atuais.value : anteriores.value))

const eventos = computed(() => eventosPorData(dias.value, lista.value, minhas.value))
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold">Escalas</h1>
      <div class="flex flex-wrap items-center gap-2">
        <Tabs v-if="modo === 'lista'" v-model="filtro">
          <TabsList class="h-9!">
            <TabsTrigger value="atuais" class="gap-1.5 px-3">
              Atuais e próximas <span class="text-xs text-muted-foreground tabular-nums">{{ atuais.length }}</span>
            </TabsTrigger>
            <TabsTrigger value="anteriores" class="gap-1.5 px-3">
              Anteriores <span class="text-xs text-muted-foreground tabular-nums">{{ anteriores.length }}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs v-model="modo">
          <TabsList class="h-9!">
            <TabsTrigger value="lista" class="px-3" aria-label="Ver em lista"><PhListBullets /> Lista</TabsTrigger>
            <TabsTrigger value="calendario" class="px-3" aria-label="Ver em calendário">
              <PhCalendarDots /> Calendário
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>

    <Alert v-if="erro" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ erro }}</AlertDescription>
    </Alert>

    <div v-if="carregando" class="flex justify-center py-12 text-primary">
      <Spinner class="size-6" />
    </div>

    <CalendarioEscalas v-else-if="modo === 'calendario'" :eventos="eventos" :hoje="hoje" />

    <EmptyState
      v-else-if="!visiveis.length"
      :icone="PhCalendarBlank"
      :titulo="filtro === 'atuais' ? 'Nenhuma escala no momento' : 'Nenhuma escala anterior'"
      :descricao="
        filtro === 'atuais'
          ? 'Quando a Orgã criar uma nova escala, ela aparecerá aqui para você escolher suas funções.'
          : undefined
      "
    />

    <ul v-else class="grid gap-3 md:grid-cols-2">
      <li v-for="e in visiveis" :key="e.id">
        <Card class="h-full">
          <CardHeader>
            <CardTitle>
              <RouterLink :to="`/escalas/${e.id}`" class="hover:text-primary hover:underline">{{ e.titulo }}</RouterLink>
            </CardTitle>
            <CardDescription>
              {{ rotuloPeriodo(e.dataInicio, e.dataFim) }} · {{ e.resumo.dias }} {{ e.resumo.dias === 1 ? 'dia' : 'dias' }}
            </CardDescription>
            <CardAction><StatusBadge :status="e.status" /></CardAction>
          </CardHeader>
          <CardContent class="flex flex-col gap-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Vagas livres</span>
              <span class="font-medium tabular-nums">
                {{ Math.max(0, e.resumo.vagas - e.resumo.ocupadas) }} de {{ e.resumo.vagas }}
              </span>
            </div>
            <Progress
              :model-value="percentual(e.resumo.ocupadas, e.resumo.vagas)"
              class="h-2"
              :aria-label="`${e.resumo.ocupadas} de ${e.resumo.vagas} vagas preenchidas`"
            />
          </CardContent>
          <CardFooter class="border-t pt-4 pb-4">
            <Button as-child size="lg" :variant="e.status === 'aberta' ? 'default' : 'outline'">
              <RouterLink :to="`/escalas/${e.id}`">
                {{ e.status === 'aberta' ? 'Escolher minhas funções' : 'Ver escala' }}
                <PhArrowRight data-icon="inline-end" />
              </RouterLink>
            </Button>
          </CardFooter>
        </Card>
      </li>
    </ul>
  </div>
</template>
