<script setup lang="ts">
import { PhArrowRight, PhCalendarBlank, PhWarningCircle } from '@phosphor-icons/vue'
import { computed, onMounted, ref } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { hojeISO } from '@/shared/lib/datas'
import { EmptyState } from '@/shared/ui'
import { escalas } from '../..'
import { percentual, rotuloPeriodo, type EscalaComResumo } from '../../domain/Escala'
import StatusBadge from '../components/StatusBadge.vue'

const lista = ref<EscalaComResumo[]>([])
const carregando = ref(true)
const erro = ref('')
const hoje = hojeISO()

onMounted(async () => {
  const r = await escalas.listar()
  carregando.value = false
  if (r.ok) lista.value = r.value
  else erro.value = r.error
})

/** Escalas visíveis para participar: abertas ou encerradas que ainda não terminaram. */
const visiveis = computed(() =>
  lista.value
    .filter((e) => (e.status === 'aberta' || e.status === 'fechada') && e.dataFim >= hoje)
    .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Escalas</h1>

    <Alert v-if="erro" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ erro }}</AlertDescription>
    </Alert>

    <div v-if="carregando" class="flex justify-center py-12 text-primary">
      <Spinner class="size-6" />
    </div>

    <EmptyState
      v-else-if="!visiveis.length"
      :icone="PhCalendarBlank"
      titulo="Nenhuma escala aberta no momento"
      descricao="Quando a Orgã abrir uma nova escala, ela aparecerá aqui para você escolher suas funções."
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
