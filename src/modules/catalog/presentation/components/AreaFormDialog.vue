<script setup lang="ts">
import { PhCheck, PhWarningCircle } from '@phosphor-icons/vue'
import { reactive, ref, watch } from 'vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/shared/composables/useToast'
import { FormInput } from '@/shared/ui'
import { catalogo } from '../..'
import { CORES_AREA, type Area } from '../../domain/Catalogo'
import { useCatalogStore } from '../stores/catalog'

const props = defineProps<{ area: Area | null }>()
const aberto = defineModel<boolean>({ required: true })
const store = useCatalogStore()

const form = reactive({ nome: '', cor: CORES_AREA[3] as string })
const erro = ref('')
const salvando = ref(false)

watch(aberto, (v) => {
  if (!v) return
  erro.value = ''
  form.nome = props.area?.nome ?? ''
  form.cor = props.area?.cor ?? CORES_AREA[3]
})

async function salvar() {
  salvando.value = true
  const r = await catalogo.salvarArea({ ...form }, store.areas, props.area?.id)
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    return
  }
  toast(props.area ? 'Área atualizada.' : 'Área criada.')
  aberto.value = false
  await store.carregar()
}
</script>

<template>
  <Dialog v-model:open="aberto">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ area ? 'Editar área' : 'Nova área' }}</DialogTitle>
      </DialogHeader>
      <form id="form-area" novalidate @submit.prevent="salvar">
        <FieldGroup class="gap-4">
          <Alert v-if="erro" variant="destructive">
            <PhWarningCircle />
            <AlertDescription>{{ erro }}</AlertDescription>
          </Alert>
          <FormInput v-model="form.nome" label="Nome" placeholder="Ex.: Portaria & Estacionamento" required />
          <FieldSet>
            <FieldLabel as="legend">Cor</FieldLabel>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="c in CORES_AREA"
                :key="c"
                type="button"
                class="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110"
                :class="form.cor === c && 'ring-2 ring-foreground'"
                :style="{ backgroundColor: c }"
                :aria-label="`Cor ${c}`"
                :aria-pressed="form.cor === c"
                @click="form.cor = c"
              >
                <PhCheck v-if="form.cor === c" class="size-4 text-black/70" weight="bold" />
              </button>
              <label class="ml-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input v-model="form.cor" type="color" class="size-8 cursor-pointer rounded border-0 bg-transparent" />
                outra
              </label>
            </div>
          </FieldSet>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" size="lg" @click="aberto = false">Cancelar</Button>
        <Button type="submit" form="form-area" size="lg" :disabled="salvando">
          <Spinner v-if="salvando" />
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
