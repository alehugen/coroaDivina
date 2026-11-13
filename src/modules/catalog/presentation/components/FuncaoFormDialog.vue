<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { computed, reactive, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/shared/composables/useToast'
import { FormInput, FormSelect, VagasInput } from '@/shared/ui'
import { catalogo } from '../..'
import { MAX_VAGAS, type DadosFuncao, type FuncaoModelo } from '../../domain/Catalogo'
import { useCatalogStore } from '../stores/catalog'

const props = defineProps<{ funcao: FuncaoModelo | null; areaId: string }>()
const aberto = defineModel<boolean>({ required: true })
const store = useCatalogStore()

const form = reactive<DadosFuncao>({ areaId: '', nome: '', vagasResp: 1, vagasAux: 3, ativo: true })
const erro = ref('')
const salvando = ref(false)

watch(aberto, (v) => {
  if (!v) return
  erro.value = ''
  const f = props.funcao
  Object.assign(form, {
    areaId: f?.areaId ?? props.areaId,
    nome: f?.nome ?? '',
    vagasResp: f?.vagasResp ?? 1,
    vagasAux: f?.vagasAux ?? 3,
    ativo: f?.ativo ?? true,
  })
})

const opcoesAreas = computed(() => store.grupos.map((a) => ({ value: a.id, label: a.nome })))

async function salvar() {
  salvando.value = true
  const daArea = store.funcoes.filter((f) => f.areaId === form.areaId)
  const r = await catalogo.salvarFuncao({ ...form }, daArea, props.funcao?.id)
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    return
  }
  toast(props.funcao ? 'Função atualizada.' : 'Função criada.')
  aberto.value = false
  await store.carregar()
}
</script>

<template>
  <Dialog v-model:open="aberto">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ funcao ? 'Editar função' : 'Nova função' }}</DialogTitle>
        <DialogDescription>
          As vagas aqui são o padrão usado ao criar novas escalas. Em cada escala dá para ajustar por dia.
        </DialogDescription>
      </DialogHeader>
      <form id="form-funcao" novalidate @submit.prevent="salvar">
        <FieldGroup class="gap-4">
          <Alert v-if="erro" variant="destructive">
            <PhWarningCircle />
            <AlertDescription>{{ erro }}</AlertDescription>
          </Alert>
          <FormSelect v-model="form.areaId" label="Área" :opcoes="opcoesAreas" required />
          <FormInput v-model="form.nome" label="Nome da função" placeholder="Ex.: Lanche da Tarde" required />
          <div class="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Vagas Responsável</FieldLabel>
              <VagasInput v-model="form.vagasResp" rotulo="vagas de responsável" :max="MAX_VAGAS" />
            </Field>
            <Field>
              <FieldLabel>Vagas Auxiliar</FieldLabel>
              <VagasInput v-model="form.vagasAux" rotulo="vagas de auxiliar" :max="MAX_VAGAS" />
            </Field>
          </div>
          <Field orientation="horizontal">
            <Switch id="funcao-ativa" v-model="form.ativo" />
            <FieldLabel for="funcao-ativa" class="font-normal">Incluir por padrão em novas escalas</FieldLabel>
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" size="lg" @click="aberto = false">Cancelar</Button>
        <Button type="submit" form="form-funcao" size="lg" :disabled="salvando">
          <Spinner v-if="salvando" />
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
