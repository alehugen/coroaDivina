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
import { useMembersStore } from '@/modules/members'
import { toast } from '@/shared/composables/useToast'
import { FormSelect } from '@/shared/ui'
import { escalas } from '../../..'
import type { FuncaoDoDia, Papel } from '../../../domain/Escala'
import { ROTULO_PAPEL, vagasLivres } from '../../../domain/Inscricao'
import { useEscalaAtualStore } from '../../stores/escalaAtual'

const props = defineProps<{ funcao: FuncaoDoDia }>()
const aberto = defineModel<boolean>({ required: true })
const membros = useMembersStore()
const store = useEscalaAtualStore()

const profileId = ref('')
const papel = ref<Papel | ''>('')
const erro = ref('')
const salvando = ref(false)

watch(aberto, async (v) => {
  if (!v) return
  erro.value = ''
  profileId.value = ''
  papel.value = vagasLivres(props.funcao, 'responsavel') > 0 ? 'responsavel' : 'auxiliar'
  // sempre atualiza: quem acabou de se cadastrar já aparece (a lista anterior fica visível enquanto isso)
  await membros.carregarSocios()
})

const opcoesSocios = computed(() => {
  const jaNaFuncao = new Set(props.funcao.inscricoes.map((i) => i.profileId))
  return membros.aprovados.filter((s) => !jaNaFuncao.has(s.id)).map((s) => ({ value: s.id, label: s.nome }))
})

const opcoesPapel = computed(() =>
  (['responsavel', 'auxiliar'] as const).map((p) => {
    const n = vagasLivres(props.funcao, p)
    return { value: p, label: `${ROTULO_PAPEL[p]} (${n === 0 ? 'lotado' : `${n} ${n === 1 ? 'vaga' : 'vagas'}`})` }
  }),
)

async function adicionar() {
  if (!profileId.value) {
    erro.value = 'Escolha o sócio.'
    return
  }
  if (!papel.value) {
    erro.value = 'Escolha o papel.'
    return
  }
  salvando.value = true
  const r = await escalas.inscrever(props.funcao.id, papel.value, profileId.value)
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    return
  }
  const nome = membros.aprovados.find((s) => s.id === profileId.value)?.nome
  toast(`${nome} incluído(a) em ${props.funcao.nome}.`)
  aberto.value = false
  await store.recarregar()
}
</script>

<template>
  <Dialog v-model:open="aberto">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Incluir pessoa em {{ funcao.nome }}</DialogTitle>
        <DialogDescription>
          A pessoa aparece na escala imediatamente. Para aumentar vagas, ajuste os números ao lado da função.
        </DialogDescription>
      </DialogHeader>
      <form id="form-add-pessoa" novalidate @submit.prevent="adicionar">
        <FieldGroup class="gap-4">
          <Alert v-if="erro" variant="destructive">
            <PhWarningCircle />
            <AlertDescription>{{ erro }}</AlertDescription>
          </Alert>
          <FormSelect v-model="profileId" label="Sócio" placeholder="Selecione…" :opcoes="opcoesSocios" required />
          <FormSelect v-model="papel" label="Papel" :opcoes="opcoesPapel" required />
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" size="lg" @click="aberto = false">Cancelar</Button>
        <Button type="submit" form="form-add-pessoa" size="lg" :disabled="salvando">
          <Spinner v-if="salvando" />
          Incluir
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
