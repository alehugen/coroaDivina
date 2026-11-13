<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { toast } from '@/shared/composables/useToast'
import {
  BaseAlert,
  BaseButton,
  BaseInput,
  BaseModal,
  BaseSelect,
  BaseSwitch,
  NumberInput,
} from '@/shared/ui'
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
  <BaseModal
    v-model="aberto"
    :titulo="funcao ? 'Editar função' : 'Nova função'"
    descricao="As vagas aqui são o padrão usado ao criar novas escalas. Em cada escala você pode ajustar por dia."
  >
    <form id="form-funcao" class="flex flex-col gap-4" novalidate @submit.prevent="salvar">
      <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>
      <BaseSelect v-model="form.areaId" label="Área" :opcoes="opcoesAreas" required />
      <BaseInput v-model="form.nome" label="Nome da função" placeholder="Ex.: Lanche da Tarde" required />
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-text">Vagas Responsável</span>
          <NumberInput v-model="form.vagasResp" rotulo="vagas de responsável" :max="MAX_VAGAS" />
        </div>
        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-text">Vagas Auxiliar</span>
          <NumberInput v-model="form.vagasAux" rotulo="vagas de auxiliar" :max="MAX_VAGAS" />
        </div>
      </div>
      <BaseSwitch v-model="form.ativo" rotulo="Incluir por padrão em novas escalas" mostrar-rotulo />
    </form>
    <template #rodape>
      <BaseButton variant="secondary" @click="aberto = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="form-funcao" :loading="salvando">Salvar</BaseButton>
    </template>
  </BaseModal>
</template>
