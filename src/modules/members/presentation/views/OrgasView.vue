<script setup lang="ts">
import { PhCrown, PhStopCircle, PhTrash, PhWarning, PhWarningCircle } from '@phosphor-icons/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { GrauBadge, podeSerOrga, useSessionStore } from '@/modules/identity'
import { confirmar } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import { formatarData, hojeISO } from '@/shared/lib/datas'
import { CarregandoConteudo, EmptyState, FormInput, FormSelect, UserAvatar } from '@/shared/ui'
import { membros } from '../..'
import { fimSugerido, situacao, sobreposicoes, type Mandato, type SituacaoMandato } from '../../domain/Mandato'
import { useMembersStore } from '../stores/members'

const store = useMembersStore()
const session = useSessionStore()
const hoje = hojeISO()

onMounted(() => Promise.all([store.carregarMandatos(), store.socios.length ? null : store.carregarSocios()]))

// --- formulário
const form = reactive({ profileId: '', inicio: hoje, fim: fimSugerido(hoje) })
const fimEditado = ref(false)
const erroForm = ref('')
const salvando = ref(false)

watch(
  () => form.inicio,
  (inicio) => {
    if (inicio && !fimEditado.value) form.fim = fimSugerido(inicio)
  },
)

// Só CDC e QM podem ser Orgã
const opcoesSocios = computed(() =>
  store.aprovados.filter((s) => podeSerOrga(s.grau)).map((s) => ({ value: s.id, label: `${s.nome} (${s.grau})` })),
)
const grauDe = (profileId: string) => store.socios.find((s) => s.id === profileId)?.grau
const conflitos = computed(() =>
  form.profileId && form.inicio && form.fim ? sobreposicoes(form, store.mandatos) : [],
)

async function criar() {
  erroForm.value = ''
  salvando.value = true
  const r = await membros.criarMandato({ ...form }, store.mandatos)
  salvando.value = false
  if (!r.ok) {
    erroForm.value = r.error
    return
  }
  const nome = store.aprovados.find((s) => s.id === form.profileId)?.nome
  toast(`Mandato de ${nome} cadastrado.`)
  form.profileId = ''
  fimEditado.value = false
  await recarregar()
}

// --- lista
const grupos = computed(() => {
  const g: Record<SituacaoMandato, Mandato[]> = { vigente: [], futuro: [], encerrado: [] }
  for (const m of store.mandatos) g[situacao(m, hoje)].push(m)
  g.futuro.reverse() // próximos primeiro
  return g
})

const SECOES: { chave: SituacaoMandato; titulo: string }[] = [
  { chave: 'vigente', titulo: 'Em exercício' },
  { chave: 'futuro', titulo: 'Próximos' },
  { chave: 'encerrado', titulo: 'Anteriores' },
]

const ocupado = ref<string | null>(null)

async function recarregar() {
  await store.carregarMandatos()
  // Se o admin alterou o próprio mandato, atualiza as permissões da sessão
  await session.recarregar()
}

async function encerrar(m: Mandato) {
  const ok = await confirmar({
    titulo: `Encerrar o mandato de ${m.nome}?`,
    mensagem: 'As permissões de Orgã deixam de valer a partir de hoje.',
    confirmar: 'Encerrar',
    tom: 'danger',
  })
  if (!ok) return
  ocupado.value = m.id
  const r = await membros.encerrarMandato(m)
  ocupado.value = null
  if (!r.ok) return toast(r.error, 'danger')
  toast(`Mandato de ${m.nome} encerrado.`)
  await recarregar()
}

async function remover(m: Mandato) {
  const ok = await confirmar({
    titulo: `Remover o mandato de ${m.nome}?`,
    mensagem: `${formatarData(m.inicio)} a ${formatarData(m.fim)}. Essa ação não pode ser desfeita.`,
    confirmar: 'Remover',
    tom: 'danger',
  })
  if (!ok) return
  ocupado.value = m.id
  const r = await membros.removerMandato(m.id)
  ocupado.value = null
  if (!r.ok) return toast(r.error, 'danger')
  toast('Mandato removido.')
  await recarregar()
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
    <Card>
      <CardHeader>
        <CardTitle>Novo mandato de Orgã</CardTitle>
        <CardDescription>
          O cargo é rotativo. Durante o período, a pessoa pode criar e gerenciar escalas. Só CDC e QM podem ser
          Orgã.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form novalidate @submit.prevent="criar">
          <FieldGroup class="gap-4">
            <Alert v-if="erroForm" variant="destructive">
              <PhWarningCircle />
              <AlertDescription>{{ erroForm }}</AlertDescription>
            </Alert>
            <FormSelect v-model="form.profileId" label="Sócio" placeholder="Selecione…" :opcoes="opcoesSocios" required />
            <p v-if="!store.carregandoSocios && !opcoesSocios.length" class="-mt-2 text-sm text-muted-foreground">
              Nenhum sócio CDC ou QM ainda. Defina o grau na aba Sócios.
            </p>
            <div class="grid grid-cols-2 gap-3">
              <FormInput v-model="form.inicio" label="Início" type="date" required />
              <FormInput v-model="form.fim" label="Fim" type="date" required @update:model-value="fimEditado = true" />
            </div>
            <Alert v-if="conflitos.length" class="border-warning/40 bg-warning-soft">
              <PhWarning class="text-warning" />
              <AlertDescription class="text-foreground">
                Período coincide com o mandato de
                <strong>{{ conflitos.map((c) => c.nome).join(', ') }}</strong>. Ambos terão acesso de Orgã nos dias em comum.
              </AlertDescription>
            </Alert>
            <Button type="submit" size="lg" class="h-10 w-full" :disabled="salvando">
              <Spinner v-if="salvando" />
              Cadastrar mandato
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>

    <div class="flex flex-col gap-6">
      <CarregandoConteudo v-if="store.carregandoMandatos && !store.mandatos.length" forma="lista" />

      <EmptyState
        v-else-if="!store.mandatos.length"
        :icone="PhCrown"
        titulo="Nenhum mandato cadastrado"
        descricao="Cadastre quem é a Orgã atual e as próximas, com as datas de início e fim."
      />

      <template v-else>
        <section v-for="s in SECOES" v-show="grupos[s.chave].length" :key="s.chave">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{{ s.titulo }}</h2>
          <ul class="divide-y overflow-hidden rounded-xl border bg-card">
            <li
              v-for="m in grupos[s.chave]"
              :key="m.id"
              class="flex items-center gap-3 px-4 py-3 sm:px-5"
              :class="s.chave === 'encerrado' && 'opacity-70'"
            >
              <UserAvatar :nome="m.nome" />
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-center gap-2 font-medium">
                  {{ m.nome }}
                  <GrauBadge v-if="grauDe(m.profileId)" :grau="grauDe(m.profileId)!" />
                  <Badge v-if="s.chave === 'vigente'" class="bg-highlight text-highlight-foreground">Orgã atual</Badge>
                </p>
                <p
                  v-if="s.chave !== 'encerrado' && grauDe(m.profileId) && !podeSerOrga(grauDe(m.profileId)!)"
                  class="text-sm font-medium text-warning"
                >
                  Sem grau CDC/QM: não consegue gerenciar escalas.
                </p>
                <p class="text-sm text-muted-foreground">{{ formatarData(m.inicio) }} a {{ formatarData(m.fim) }}</p>
              </div>
              <Spinner v-if="ocupado === m.id" class="text-primary" />
              <Tooltip v-if="s.chave === 'vigente'">
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon-lg" aria-label="Encerrar agora" :disabled="ocupado === m.id" @click="encerrar(m)">
                    <PhStopCircle class="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Encerrar agora</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    class="hover:text-destructive"
                    aria-label="Remover mandato"
                    :disabled="ocupado === m.id"
                    @click="remover(m)"
                  >
                    <PhTrash class="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remover</TooltipContent>
              </Tooltip>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </div>
</template>
