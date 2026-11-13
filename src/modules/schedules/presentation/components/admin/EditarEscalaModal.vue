<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from '@/shared/composables/useToast'
import { BaseAlert, BaseButton, BaseInput, BaseModal, BaseTextarea } from '@/shared/ui'
import { escalas } from '../../..'
import { useEscalaEditorStore } from '../../stores/escalaEditor'

const aberto = defineModel<boolean>({ required: true })
const store = useEscalaEditorStore()

const titulo = ref('')
const descricao = ref('')
const erro = ref('')
const salvando = ref(false)

watch(aberto, (v) => {
  if (!v || !store.escala) return
  erro.value = ''
  titulo.value = store.escala.titulo
  descricao.value = store.escala.descricao ?? ''
})

async function salvar() {
  if (!store.escala) return
  salvando.value = true
  const r = await escalas.atualizarDados(store.escala.id, titulo.value, descricao.value)
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    return
  }
  toast('Escala atualizada.')
  aberto.value = false
  await store.recarregar()
}
</script>

<template>
  <BaseModal v-model="aberto" titulo="Editar escala">
    <form id="form-editar-escala" class="flex flex-col gap-4" novalidate @submit.prevent="salvar">
      <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>
      <BaseInput v-model="titulo" label="Título" required />
      <BaseTextarea v-model="descricao" label="Descrição (opcional)" :rows="3" />
    </form>
    <template #rodape>
      <BaseButton variant="secondary" @click="aberto = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="form-editar-escala" :loading="salvando">Salvar</BaseButton>
    </template>
  </BaseModal>
</template>
