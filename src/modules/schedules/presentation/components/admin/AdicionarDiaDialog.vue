<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { computed, ref, watch } from 'vue'
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
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { somarDias } from '@/shared/lib/datas'
import { FormInput } from '@/shared/ui'
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
  <Dialog v-model:open="aberto">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Adicionar dia</DialogTitle>
        <DialogDescription>
          O novo dia recebe as mesmas funções usadas nesta escala, com as vagas padrão do catálogo.
        </DialogDescription>
      </DialogHeader>
      <form id="form-add-dia" novalidate @submit.prevent="adicionar">
        <FieldGroup class="gap-4">
          <Alert v-if="erro" variant="destructive">
            <PhWarningCircle />
            <AlertDescription>{{ erro }}</AlertDescription>
          </Alert>
          <FormInput v-model="data" label="Data" type="date" required />
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" size="lg" @click="aberto = false">Cancelar</Button>
        <Button type="submit" form="form-add-dia" size="lg" :disabled="salvando">
          <Spinner v-if="salvando" />
          Adicionar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
