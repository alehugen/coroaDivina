<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/modules/catalog'
import { toast } from '@/shared/composables/useToast'
import { hojeISO, somarDias } from '@/shared/lib/datas'
import { BaseAlert, BaseButton, BaseCard, BaseInput, BaseSpinner, BaseTextarea } from '@/shared/ui'
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
const periodoLongo = computed(
  () => !!form.inicio && !!form.fim && form.fim >= form.inicio && dias.value.length >= MAX_DIAS_ESCALA,
)

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

function alternar(conjunto: Set<string>, id: string) {
  if (conjunto.has(id)) conjunto.delete(id)
  else conjunto.add(id)
}

function alternarArea(ids: string[], marcar: boolean) {
  for (const id of ids) {
    if (marcar) funcoesSelecionadas.value.add(id)
    else funcoesSelecionadas.value.delete(id)
  }
}

const vagasPorDia = computed(() =>
  catalog.funcoes
    .filter((f) => funcoesSelecionadas.value.has(f.id))
    .reduce((n, f) => n + f.vagasResp + f.vagasAux, 0),
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
    <div class="flex items-center gap-3">
      <RouterLink to="/admin/escalas" class="text-sm text-muted hover:text-text">← Escalas</RouterLink>
    </div>
    <h2 class="-mt-3 text-xl font-semibold text-text">Nova escala</h2>

    <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>

    <BaseCard>
      <h3 class="mb-4 font-semibold text-text">1. Dados</h3>
      <div class="flex flex-col gap-4">
        <BaseInput
          v-model="form.titulo"
          label="Título"
          required
          @update:model-value="tituloEditado = true"
        />
        <BaseTextarea
          v-model="form.descricao"
          label="Descrição (opcional)"
          :rows="2"
          placeholder="Ex.: Preparo de novembro. Chegada a partir das 7h."
        />
      </div>
    </BaseCard>

    <BaseCard>
      <h3 class="mb-1 font-semibold text-text">2. Dias</h3>
      <p class="mb-4 text-sm text-muted">Escolha o período e desmarque os dias sem trabalho.</p>
      <div class="grid grid-cols-2 gap-3 sm:max-w-md">
        <BaseInput v-model="form.inicio" label="De" type="date" required />
        <BaseInput v-model="form.fim" label="Até" type="date" required />
      </div>
      <BaseAlert v-if="periodoLongo" tone="warning" class="mt-3">
        Mostrando só os primeiros {{ MAX_DIAS_ESCALA }} dias.
      </BaseAlert>
      <div v-if="dias.length" class="mt-4 flex flex-wrap gap-2">
        <label
          v-for="d in dias"
          :key="d"
          class="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
          :class="
            diasSelecionados.has(d)
              ? 'border-primary bg-primary-soft text-text'
              : 'border-border text-muted'
          "
        >
          <input
            type="checkbox"
            class="accent-[var(--ds-primary)]"
            :checked="diasSelecionados.has(d)"
            @change="alternar(diasSelecionados, d)"
          />
          {{ rotuloDia(d) }}
        </label>
      </div>
    </BaseCard>

    <BaseCard>
      <h3 class="mb-1 font-semibold text-text">3. Funções</h3>
      <p class="mb-4 text-sm text-muted">
        Essas funções serão criadas em todos os dias, com as vagas padrão do catálogo. Depois você
        pode desativar funções e ajustar vagas em cada dia.
      </p>

      <div v-if="catalog.carregando && !catalog.grupos.length" class="flex justify-center py-6 text-primary">
        <BaseSpinner class="size-5" />
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <fieldset v-for="a in catalog.grupos" :key="a.id" class="flex flex-col gap-2">
          <legend class="mb-2 flex w-full items-center gap-2 font-medium text-text">
            <span class="size-3 rounded-full" :style="{ backgroundColor: a.cor }" aria-hidden="true" />
            {{ a.nome }}
            <span class="ml-auto flex gap-2 text-xs font-normal">
              <button type="button" class="text-primary hover:underline" @click="alternarArea(a.funcoes.map((f) => f.id), true)">
                todas
              </button>
              <button type="button" class="text-muted hover:underline" @click="alternarArea(a.funcoes.map((f) => f.id), false)">
                nenhuma
              </button>
            </span>
          </legend>
          <label
            v-for="f in a.funcoes"
            :key="f.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2"
          >
            <input
              type="checkbox"
              class="size-4 accent-[var(--ds-primary)]"
              :checked="funcoesSelecionadas.has(f.id)"
              @change="alternar(funcoesSelecionadas, f.id)"
            />
            <span class="flex-1 text-sm text-text">{{ f.nome }}</span>
            <span class="text-xs text-muted">{{ f.vagasResp }}R · {{ f.vagasAux }}A</span>
          </label>
        </fieldset>
      </div>
    </BaseCard>

    <div
      class="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:bg-surface"
    >
      <p class="text-sm text-muted">
        <strong class="text-text">{{ diasSelecionados.size }}</strong> dias ·
        <strong class="text-text">{{ funcoesSelecionadas.size }}</strong> funções por dia ·
        <strong class="text-text">{{ vagasPorDia * diasSelecionados.size }}</strong> vagas no total
      </p>
      <BaseButton type="submit" size="lg" :loading="salvando">Criar escala</BaseButton>
    </div>
  </form>
</template>
