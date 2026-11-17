<script setup lang="ts">
import { PhCaretLeft, PhCaretRight, PhPencilSimple, PhPlus, PhPrinter, PhWarningCircle } from '@phosphor-icons/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/modules/identity'
import { mesDe, rotuloMes, somarMes } from '@/shared/lib/calendario'
import { formatarData, hojeISO, type DataISO } from '@/shared/lib/datas'
import { CarregandoConteudo, EmptyState } from '@/shared/ui'
import { agruparPorData, eventosDoMes, porData, rotuloSemana, type CorEvento, type Evento } from '../../domain/Evento'
import AgendaCalendario from '../components/AgendaCalendario.vue'
import EventoFormDialog from '../components/EventoFormDialog.vue'
import { useMesDaQuery } from '../composables/useMesDaQuery'
import { useAgendaStore } from '../stores/agenda'

const store = useAgendaStore()
const session = useSessionStore()
const hoje = hojeISO()

const { mes, chave: chaveMes, irPara: irParaMes } = useMesDaQuery()
function irPara(m: { ano: number; mes: number }) {
  selecionado.value = null
  irParaMes(m)
}

// Carrega a janela em torno do mês da URL (links da agenda podem apontar para meses distantes)
watch(chaveMes, (c) => store.garantirMes(c), { immediate: true })

const doMes = computed(() => eventosDoMes(store.eventos, mes.value.ano, mes.value.mes))
const mapa = computed(() => porData(store.eventos))
const grupos = computed(() => agruparPorData(doMes.value))

// --- seleção de dia: rola até os eventos do dia; quem edita, num dia vazio, já abre o formulário
const selecionado = ref<DataISO | null>(null)
async function escolher(data: DataISO) {
  if (!data.startsWith(chaveMes.value)) irPara(mesDe(data)) // dia de borda: vai para o mês dele
  selecionado.value = data
  if (!mapa.value.get(data)?.length) {
    if (session.editaAgenda) novo(data)
    return
  }
  await nextTick()
  document.getElementById(`dia-${data}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// --- edição
const modal = ref(false)
const emEdicao = ref<Evento | null>(null)
const dataNova = ref<DataISO>(hoje)
function novo(data?: DataISO) {
  emEdicao.value = null
  dataNova.value = data ?? (hoje.startsWith(chaveMes.value) ? hoje : `${chaveMes.value}-01`)
  modal.value = true
}
function editar(e: Evento) {
  if (!session.editaAgenda) return
  emEdicao.value = e
  modal.value = true
}

const LINHA: Record<CorEvento, string> = { nenhuma: '', amarela: 'evento-amarelo', verde: 'evento-verde' }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold">Agenda do núcleo</h1>
      <div class="flex flex-wrap gap-2">
        <Button as-child variant="outline">
          <RouterLink :to="{ path: '/agenda/imprimir', query: { mes: chaveMes } }"><PhPrinter /> Imprimir / WhatsApp</RouterLink>
        </Button>
        <Button v-if="session.editaAgenda" @click="novo()"><PhPlus /> Evento</Button>
      </div>
    </div>

    <!-- Navegação do mês -->
    <div class="flex items-center gap-2">
      <Button variant="outline" size="icon-lg" aria-label="Mês anterior" @click="irPara(somarMes(mes, -1))">
        <PhCaretLeft />
      </Button>
      <h2 class="min-w-0 flex-1 text-center font-semibold sm:text-lg" aria-live="polite">{{ rotuloMes(mes.ano, mes.mes) }}</h2>
      <Button variant="outline" size="icon-lg" aria-label="Próximo mês" @click="irPara(somarMes(mes, 1))">
        <PhCaretRight />
      </Button>
      <Button variant="ghost" :disabled="hoje.startsWith(chaveMes)" @click="irPara(mesDe(hoje))">Hoje</Button>
    </div>

    <Alert v-if="store.erro" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ store.erro }}</AlertDescription>
    </Alert>

    <CarregandoConteudo v-if="store.carregando && !store.carregado" forma="grade" />

    <template v-else>
      <AgendaCalendario
        :ano="mes.ano"
        :mes="mes.mes"
        :hoje="hoje"
        :eventos="mapa"
        :selecionado="selecionado"
        @escolher="escolher"
      />

      <!-- Lista do mês (como a tabela de hoje) -->
      <EmptyState
        v-if="!grupos.length"
        coroa
        :titulo="`Nenhum evento em ${rotuloMes(mes.ano, mes.mes).toLowerCase()}`"
        :descricao="session.editaAgenda ? 'Toque num dia do calendário para adicionar.' : undefined"
      />
      <ol v-else class="divide-y overflow-hidden rounded-xl border bg-card">
        <li
          v-for="g in grupos"
          :id="`dia-${g.data}`"
          :key="g.data"
          class="grid scroll-mt-24 grid-cols-[4.5rem_1fr] transition-colors sm:grid-cols-[8rem_1fr]"
          :class="selecionado === g.data && 'bg-accent/50'"
        >
          <div class="flex flex-col justify-center border-r px-3 py-2.5" :class="g.data === hoje && 'text-primary'">
            <span class="text-lg leading-tight font-bold tabular-nums">{{ formatarData(g.data, 'dd/MM') }}</span>
            <span class="text-xs text-muted-foreground">{{ rotuloSemana(g.data) }}</span>
          </div>
          <ul class="divide-y">
            <li v-for="e in g.eventos" :key="e.id" :class="LINHA[e.cor]">
              <component
                :is="session.editaAgenda ? 'button' : 'div'"
                :type="session.editaAgenda ? 'button' : undefined"
                class="flex w-full items-start gap-2 px-3 py-2.5 text-left sm:px-4"
                :class="session.editaAgenda && 'transition-colors hover:bg-foreground/5'"
                :aria-label="session.editaAgenda ? `Editar ${e.titulo}` : undefined"
                @click="editar(e)"
              >
                <span class="min-w-0 flex-1">
                  <span class="block font-semibold">
                    <span v-if="e.hora" class="tabular-nums">{{ e.hora }} · </span>{{ e.titulo }}
                  </span>
                  <span v-if="e.detalhe" class="block text-sm whitespace-pre-line text-muted-foreground">{{ e.detalhe }}</span>
                </span>
                <PhPencilSimple v-if="session.editaAgenda" class="mt-1 size-4 shrink-0 text-muted-foreground" />
              </component>
            </li>
          </ul>
        </li>
      </ol>
    </template>

    <EventoFormDialog v-if="session.editaAgenda" v-model="modal" :evento="emEdicao" :data="dataNova" />
  </div>
</template>
