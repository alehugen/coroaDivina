<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { computed, reactive, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { MAX_VAGAS, useCatalogStore } from '@/modules/catalog'
import { FormInput, FormSelect, VagasInput } from '@/shared/ui'
import { escalas } from '../../..'
import type { DiaEscala } from '../../../domain/Escala'
import { useEscalaEditorStore } from '../../stores/escalaEditor'

const props = defineProps<{ dia: DiaEscala | null }>()
const aberto = defineModel<boolean>({ required: true })
const catalog = useCatalogStore()
const store = useEscalaEditorStore()

const OUTRA = '__outra__'
const form = reactive({ modeloId: '', areaId: '', nome: '', vagasResp: 1, vagasAux: 2 })
const erro = ref('')
const salvando = ref(false)

watch(aberto, async (v) => {
  if (!v) return
  erro.value = ''
  Object.assign(form, { modeloId: '', areaId: '', nome: '', vagasResp: 1, vagasAux: 2 })
  await catalog.garantir()
})

/** Modelos do catálogo que ainda não estão neste dia. */
const disponiveis = computed(() => {
  const usados = new Set(props.dia?.funcoes.map((f) => f.funcaoModeloId).filter(Boolean))
  return catalog.funcoes.filter((f) => !usados.has(f.id))
})

const opcoesModelos = computed(() => [
  ...catalog.grupos.flatMap((a) =>
    disponiveis.value.filter((f) => f.areaId === a.id).map((f) => ({ value: f.id, label: `${a.nome} › ${f.nome}` })),
  ),
  { value: OUTRA, label: 'Outra (nome livre)…' },
])

const opcoesAreas = computed(() => catalog.grupos.map((a) => ({ value: a.id, label: a.nome })))

watch(
  () => form.modeloId,
  (id) => {
    const m = catalog.funcoes.find((f) => f.id === id)
    if (m) Object.assign(form, { areaId: m.areaId, nome: m.nome, vagasResp: m.vagasResp, vagasAux: m.vagasAux })
    else if (id === OUTRA) Object.assign(form, { nome: '', areaId: catalog.grupos[0]?.id ?? '' })
  },
)

async function adicionar() {
  if (!props.dia) return
  if (!form.modeloId) {
    erro.value = 'Escolha uma função.'
    return
  }
  salvando.value = true
  const r = await escalas.adicionarFuncao(props.dia, {
    areaId: form.areaId,
    nome: form.nome,
    vagasResp: form.vagasResp,
    vagasAux: form.vagasAux,
    funcaoModeloId: form.modeloId === OUTRA ? null : form.modeloId,
  })
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    return
  }
  aberto.value = false
  await store.recarregar()
}
</script>

<template>
  <Dialog v-model:open="aberto">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Adicionar função ao dia</DialogTitle>
      </DialogHeader>
      <form id="form-add-funcao" novalidate @submit.prevent="adicionar">
        <FieldGroup class="gap-4">
          <Alert v-if="erro" variant="destructive">
            <PhWarningCircle />
            <AlertDescription>{{ erro }}</AlertDescription>
          </Alert>
          <FormSelect v-model="form.modeloId" label="Função" placeholder="Selecione…" :opcoes="opcoesModelos" required />
          <template v-if="form.modeloId === OUTRA">
            <FormSelect v-model="form.areaId" label="Área" :opcoes="opcoesAreas" required />
            <FormInput v-model="form.nome" label="Nome da função" placeholder="Ex.: Ceia" required />
          </template>
          <div v-if="form.modeloId" class="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Vagas Responsável</FieldLabel>
              <VagasInput v-model="form.vagasResp" rotulo="vagas de responsável" :max="MAX_VAGAS" />
            </Field>
            <Field>
              <FieldLabel>Vagas Auxiliar</FieldLabel>
              <VagasInput v-model="form.vagasAux" rotulo="vagas de auxiliar" :max="MAX_VAGAS" />
            </Field>
          </div>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" size="lg" @click="aberto = false">Cancelar</Button>
        <Button type="submit" form="form-add-funcao" size="lg" :disabled="salvando">
          <Spinner v-if="salvando" />
          Adicionar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
