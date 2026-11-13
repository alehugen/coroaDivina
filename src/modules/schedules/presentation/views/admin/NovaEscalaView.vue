<script setup lang="ts">
import { PhArrowLeft, PhWarning, PhWarningCircle } from '@phosphor-icons/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { useCatalogStore } from '@/modules/catalog'
import { toast } from '@/shared/composables/useToast'
import { hojeISO, somarDias } from '@/shared/lib/datas'
import { FormInput, FormTextarea } from '@/shared/ui'
import { escalas } from '../../..'
import { diasNoPeriodo, MAX_DIAS_ESCALA, rotuloDia, tituloSugerido } from '../../../domain/Escala'

const router = useRouter()
const catalog = useCatalogStore()

const inicioPadrao = hojeISO()
const form = reactive({
  titulo: tituloSugerido(inicioPadrao),
  descricao: '',
  inicio: inicioPadrao,
  fim: somarDias(inicioPadrao, 3),
})
const tituloEditado = ref(false)
const diasSelecionados = ref(new Set<string>())
const funcoesSelecionadas = ref(new Set<string>())
const erro = ref('')
const salvando = ref(false)

onMounted(async () => {
  await catalog.carregar()
  funcoesSelecionadas.value = new Set(catalog.funcoes.filter((f) => f.ativo).map((f) => f.id))
})

const dias = computed(() => diasNoPeriodo(form.inicio, form.fim))
const periodoLongo = computed(() => dias.value.length >= MAX_DIAS_ESCALA)

// Todo dia novo do período entra marcado
watch(
  dias,
  (novos, antigos) => {
    const s = new Set([...diasSelecionados.value].filter((d) => novos.includes(d)))
    for (const d of novos) if (!antigos?.includes(d)) s.add(d)
    diasSelecionados.value = s
  },
  { immediate: true },
)

watch(
  () => form.inicio,
  (v) => {
    if (v && !tituloEditado.value) form.titulo = tituloSugerido(v)
  },
)

function marcar(conjunto: Set<string>, id: string, valor: boolean | 'indeterminate') {
  if (valor === true) conjunto.add(id)
  else conjunto.delete(id)
}

function marcarArea(ids: string[], valor: boolean) {
  for (const id of ids) marcar(funcoesSelecionadas.value, id, valor)
}

const vagasPorDia = computed(() =>
  catalog.funcoes.filter((f) => funcoesSelecionadas.value.has(f.id)).reduce((n, f) => n + f.vagasResp + f.vagasAux, 0),
)

async function criar() {
  erro.value = ''
  salvando.value = true
  const r = await escalas.criar({
    titulo: form.titulo,
    descricao: form.descricao,
    datas: [...diasSelecionados.value],
    funcaoModeloIds: [...funcoesSelecionadas.value],
  })
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  toast('Escala criada como rascunho. Ajuste os dias e abra as inscrições quando estiver pronta.')
  router.replace(`/admin/escalas/${r.value}`)
}
</script>

<template>
  <form class="flex flex-col gap-6" novalidate @submit.prevent="criar">
    <div>
      <Button as-child variant="ghost" class="-ml-2 text-muted-foreground">
        <RouterLink to="/admin/escalas"><PhArrowLeft /> Escalas</RouterLink>
      </Button>
      <h2 class="mt-1 text-xl font-semibold">Nova escala</h2>
    </div>

    <Alert v-if="erro" variant="destructive">
      <PhWarningCircle />
      <AlertDescription>{{ erro }}</AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>1. Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup class="gap-4">
          <FormInput v-model="form.titulo" label="Título" required @update:model-value="tituloEditado = true" />
          <FormTextarea
            v-model="form.descricao"
            label="Descrição (opcional)"
            :rows="2"
            placeholder="Ex.: Preparo de novembro. Chegada a partir das 7h."
          />
        </FieldGroup>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>2. Dias</CardTitle>
        <CardDescription>Escolha o período e desmarque os dias sem trabalho.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-3 sm:max-w-md">
          <FormInput v-model="form.inicio" label="De" type="date" required />
          <FormInput v-model="form.fim" label="Até" type="date" required />
        </div>
        <Alert v-if="periodoLongo" class="border-warning/40 bg-warning-soft">
          <PhWarning class="text-warning" />
          <AlertDescription class="text-foreground">Mostrando só os primeiros {{ MAX_DIAS_ESCALA }} dias.</AlertDescription>
        </Alert>
        <div v-if="dias.length" class="flex flex-wrap gap-2">
          <label
            v-for="d in dias"
            :key="d"
            class="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
            :class="diasSelecionados.has(d) ? 'border-primary bg-accent' : 'text-muted-foreground'"
          >
            <Checkbox :model-value="diasSelecionados.has(d)" @update:model-value="marcar(diasSelecionados, d, $event)" />
            {{ rotuloDia(d) }}
          </label>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>3. Funções</CardTitle>
        <CardDescription>
          Essas funções serão criadas em todos os dias, com as vagas padrão do catálogo. Depois você pode
          desativar funções e ajustar vagas em cada dia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="catalog.carregando && !catalog.grupos.length" class="flex justify-center py-6 text-primary">
          <Spinner class="size-5" />
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <fieldset v-for="a in catalog.grupos" :key="a.id" class="flex flex-col gap-1">
            <legend class="mb-2 flex w-full items-center gap-2 font-medium">
              <span class="size-3 rounded-full" :style="{ backgroundColor: a.cor }" aria-hidden="true" />
              {{ a.nome }}
              <span class="ml-auto flex gap-1">
                <Button type="button" variant="link" size="xs" @click="marcarArea(a.funcoes.map((f) => f.id), true)">
                  todas
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  class="text-muted-foreground"
                  @click="marcarArea(a.funcoes.map((f) => f.id), false)"
                >
                  nenhuma
                </Button>
              </span>
            </legend>
            <label
              v-for="f in a.funcoes"
              :key="f.id"
              class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
            >
              <Checkbox
                :model-value="funcoesSelecionadas.has(f.id)"
                @update:model-value="marcar(funcoesSelecionadas, f.id, $event)"
              />
              <span class="flex-1 text-sm">{{ f.nome }}</span>
              <span class="text-xs text-muted-foreground tabular-nums">{{ f.vagasResp }}R · {{ f.vagasAux }}A</span>
            </label>
          </fieldset>
        </div>
      </CardContent>
    </Card>

    <div
      class="sticky bottom-16 -mx-4 flex flex-col gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:bg-card md:bottom-0"
    >
      <p class="text-sm text-muted-foreground">
        <strong class="text-foreground">{{ diasSelecionados.size }}</strong> dias ·
        <strong class="text-foreground">{{ funcoesSelecionadas.size }}</strong> funções por dia ·
        <strong class="text-foreground">{{ vagasPorDia * diasSelecionados.size }}</strong> vagas no total
      </p>
      <Button type="submit" size="lg" class="h-11" :disabled="salvando">
        <Spinner v-if="salvando" />
        Criar escala
      </Button>
    </div>
  </form>
</template>
