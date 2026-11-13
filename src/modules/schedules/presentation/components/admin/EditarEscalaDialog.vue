<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/shared/composables/useToast'
import { FormInput, FormTextarea } from '@/shared/ui'
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
  <Dialog v-model:open="aberto">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Editar escala</DialogTitle>
      </DialogHeader>
      <form id="form-editar-escala" novalidate @submit.prevent="salvar">
        <FieldGroup class="gap-4">
          <Alert v-if="erro" variant="destructive">
            <PhWarningCircle />
            <AlertDescription>{{ erro }}</AlertDescription>
          </Alert>
          <FormInput v-model="titulo" label="Título" required />
          <FormTextarea v-model="descricao" label="Descrição (opcional)" :rows="3" />
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" size="lg" @click="aberto = false">Cancelar</Button>
        <Button type="submit" form="form-editar-escala" size="lg" :disabled="salvando">
          <Spinner v-if="salvando" />
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
