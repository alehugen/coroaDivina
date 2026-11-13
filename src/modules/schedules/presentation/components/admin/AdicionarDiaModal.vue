<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { somarDias } from '@/shared/lib/datas'
import { BaseAlert, BaseButton, BaseInput, BaseModal } from '@/shared/ui'
import { escalas } from '../../..'
import { useEscalaEditorStore } from '../../stores/escalaEditor'

const aberto = defineModel<boolean>({ required: true })
const emit = defineEmits<{ adicionado: [data: string] }>()
const store = useEscalaEditorStore()

const data = ref('')
const erro = ref('')
const salvando = ref(false)

watch(aberto, (v) => {
  if (!v || !store.escala) return
  erro.value = ''
  data.value = somarDias(store.escala.dataFim, 1)
})

/** O novo dia recebe as mesmas funções do catálogo já usadas nesta escala. */
const modelosDaEscala = computed(() => [
  ...new Set(
    store.escala?.dias.flatMap((d) => d.funcoes.map((f) => f.funcaoModeloId)).filter((id): id is string => !!id),
  ),
])

async function adicionar() {
  if (!store.escala) return
  salvando.value = true
  const r = await escalas.adicionarDia(store.escala.id, data.value, store.escala.dias, modelosDaEscala.value)
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    return
  }
  aberto.value = false
  await store.recarregar()
  emit('adicionado', data.value)
}
</script>

<template>
  <BaseModal
    v-model="aberto"
    titulo="Adicionar dia"
    descricao="O novo dia recebe as mesmas funções usadas nesta escala, com as vagas padrão do catálogo."
  >
    <form id="form-add-dia" class="flex flex-col gap-4" novalidate @submit.prevent="adicionar">
      <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>
      <BaseInput v-model="data" label="Data" type="date" required />
    </form>
    <template #rodape>
      <BaseButton variant="secondary" @click="aberto = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="form-add-dia" :loading="salvando">Adicionar</BaseButton>
    </template>
  </BaseModal>
</template>
