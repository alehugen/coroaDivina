<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import { toast } from '@/shared/composables/useToast'
import { somarDias } from '@/shared/lib/datas'
import { FormInput } from '@/shared/ui'
import { escalas } from '../..'
import { rotuloPeriodo, tituloSugerido, type Escala } from '../../domain/Escala'

const props = defineProps<{ origem: Escala | null }>()
const aberto = defineModel<boolean>({ required: true })
const router = useRouter()

const titulo = ref('')
const inicio = ref('')
const erro = ref('')
const salvando = ref(false)

watch(aberto, (v) => {
  if (!v || !props.origem) return
  erro.value = ''
  // Sugestão: mesma escala 4 semanas depois (mesmo dia da semana)
  inicio.value = somarDias(props.origem.dataInicio, 28)
  titulo.value = tituloSugerido(inicio.value)
})

watch(inicio, (v) => {
  if (v && titulo.value.startsWith('Escala do Preparo –')) titulo.value = tituloSugerido(v)
})

async function duplicar() {
  if (!props.origem) return
  salvando.value = true
  const r = await escalas.duplicar(props.origem.id, titulo.value, inicio.value)
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    return
  }
  toast('Escala duplicada como rascunho.')
  aberto.value = false
  router.push(`/admin/escalas/${r.value}`)
}
</script>

<template>
  <Dialog v-model:open="aberto">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Duplicar escala</DialogTitle>
        <DialogDescription v-if="origem">
          Copia dias, funções, vagas e observações de “{{ origem.titulo }}” ({{
            rotuloPeriodo(origem.dataInicio, origem.dataFim)
          }}), sem as inscrições. As datas são deslocadas para o novo início.
        </DialogDescription>
      </DialogHeader>
      <form id="form-duplicar" novalidate @submit.prevent="duplicar">
        <FieldGroup class="gap-4">
          <Alert v-if="erro" variant="destructive">
            <PhWarningCircle />
            <AlertDescription>{{ erro }}</AlertDescription>
          </Alert>
          <FormInput v-model="inicio" label="Novo início" type="date" required />
          <FormInput v-model="titulo" label="Título" required />
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" size="lg" @click="aberto = false">Cancelar</Button>
        <Button type="submit" form="form-duplicar" size="lg" :disabled="salvando">
          <Spinner v-if="salvando" />
          Duplicar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
