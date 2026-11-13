<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/shared/composables/useToast'
import { somarDias } from '@/shared/lib/datas'
import { BaseAlert, BaseButton, BaseInput, BaseModal } from '@/shared/ui'
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
  // Sugestão: mesma escala ~4 semanas depois (mesmo dia da semana)
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
  <BaseModal
    v-model="aberto"
    titulo="Duplicar escala"
    :descricao="
      origem
        ? `Copia dias, funções, vagas e observações de “${origem.titulo}” (${rotuloPeriodo(origem.dataInicio, origem.dataFim)}), sem as inscrições. As datas são deslocadas para o novo início.`
        : ''
    "
  >
    <form id="form-duplicar" class="flex flex-col gap-4" novalidate @submit.prevent="duplicar">
      <BaseAlert v-if="erro" tone="danger">{{ erro }}</BaseAlert>
      <BaseInput v-model="inicio" label="Novo início" type="date" required />
      <BaseInput v-model="titulo" label="Título" required />
    </form>
    <template #rodape>
      <BaseButton variant="secondary" @click="aberto = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="form-duplicar" :loading="salvando">Duplicar</BaseButton>
    </template>
  </BaseModal>
</template>
