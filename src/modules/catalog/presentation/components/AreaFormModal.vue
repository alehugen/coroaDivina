<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { toast } from '@/shared/composables/useToast'
import { BaseAlert, BaseButton, BaseInput, BaseModal } from '@/shared/ui'
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
  <BaseModal v-model="aberto" :titulo="area ? 'Editar área' : 'Nova área'">
    <form id="form-area" class="flex flex-col gap-4" novalidate @submit.prevent="salvar">
      <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>
      <BaseInput v-model="form.nome" label="Nome" placeholder="Ex.: Portaria & Estacionamento" required />
      <fieldset>
        <legend class="mb-2 text-sm font-medium text-text">Cor</legend>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="c in CORES_AREA"
            :key="c"
            type="button"
            class="size-8 rounded-full border-2 transition-transform hover:scale-110"
            :class="form.cor === c ? 'border-text' : 'border-transparent'"
            :style="{ backgroundColor: c }"
            :aria-label="`Cor ${c}`"
            :aria-pressed="form.cor === c"
            @click="form.cor = c"
          />
          <label class="ml-1 inline-flex items-center gap-2 text-sm text-muted">
            <input v-model="form.cor" type="color" class="size-8 cursor-pointer rounded border-0 bg-transparent" />
            outra
          </label>
        </div>
      </fieldset>
    </form>
    <template #rodape>
      <BaseButton variant="secondary" @click="aberto = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="form-area" :loading="salvando">Salvar</BaseButton>
    </template>
  </BaseModal>
</template>
