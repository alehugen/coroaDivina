<script setup lang="ts">
import { PhTrash, PhWarningCircle } from '@phosphor-icons/vue'
import { reactive, ref, watch } from 'vue'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { confirmar } from '@/shared/composables/useConfirm'
import { toast } from '@/shared/composables/useToast'
import { formatarData, type DataISO } from '@/shared/lib/datas'
import { FormInput, FormTextarea } from '@/shared/ui'
import { agenda } from '../..'
import { CORES_EVENTO, MAX_DETALHE, MAX_TITULO, rotuloSemana, type DadosEvento, type Evento } from '../../domain/Evento'
import { useAgendaStore } from '../stores/agenda'

/** Cria (evento null) ou edita um evento. `data` = dia sugerido ao criar. */
const props = defineProps<{ evento: Evento | null; data: DataISO }>()
const aberto = defineModel<boolean>({ required: true })
const store = useAgendaStore()

const form = reactive<DadosEvento & { hora: string }>({ data: '', hora: '', titulo: '', detalhe: '', cor: 'nenhuma' })
const erro = ref('')
const salvando = ref(false)

watch(aberto, (v) => {
  if (!v) return
  erro.value = ''
  const e = props.evento
  Object.assign(form, {
    data: e?.data ?? props.data,
    hora: e?.hora ?? '',
    titulo: e?.titulo ?? '',
    detalhe: e?.detalhe ?? '',
    cor: e?.cor ?? 'nenhuma',
  })
})

async function salvar() {
  salvando.value = true
  const r = await agenda.salvar({ ...form, hora: form.hora || null }, props.evento?.id)
  salvando.value = false
  if (!r.ok) {
    erro.value = r.error
    return
  }
  toast(props.evento ? 'Evento atualizado.' : 'Evento adicionado à agenda.')
  aberto.value = false
  await store.recarregar()
}

async function remover() {
  const e = props.evento
  if (!e) return
  const ok = await confirmar({
    titulo: `Remover "${e.titulo}"?`,
    mensagem: `${formatarData(e.data)} · ${rotuloSemana(e.data)}. Essa ação não pode ser desfeita.`,
    confirmar: 'Remover',
    tom: 'danger',
  })
  if (!ok) return
  salvando.value = true
  const r = await agenda.remover(e.id)
  salvando.value = false
  if (!r.ok) return toast(r.error, 'danger')
  toast('Evento removido.')
  aberto.value = false
  await store.recarregar()
}

/** Amostra de cada destaque (as mesmas cores da agenda). */
const AMOSTRA: Record<DadosEvento['cor'], string> = {
  nenhuma: 'bg-card',
  amarela: 'evento-amarelo',
  verde: 'evento-verde',
}
</script>

<template>
  <Dialog v-model:open="aberto">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ evento ? 'Editar evento' : 'Novo evento' }}</DialogTitle>
        <DialogDescription>Todos os sócios veem a agenda.</DialogDescription>
      </DialogHeader>
      <form id="form-evento" novalidate @submit.prevent="salvar">
        <FieldGroup class="gap-4">
          <Alert v-if="erro" variant="destructive">
            <PhWarningCircle />
            <AlertDescription>{{ erro }}</AlertDescription>
          </Alert>
          <div class="grid grid-cols-[1.4fr_1fr] gap-3">
            <FormInput
              v-model="form.data"
              label="Data"
              type="date"
              required
              :hint="form.data ? rotuloSemana(form.data) : undefined"
            />
            <FormInput v-model="form.hora" label="Horário" type="time" hint="Opcional" />
          </div>
          <FormInput
            v-model="form.titulo"
            label="Título"
            placeholder="Ex.: Sessão Instrutiva"
            :maxlength="MAX_TITULO"
            required
          />
          <FormTextarea
            v-model="form.detalhe"
            label="Complemento"
            placeholder="Ex.: MAC Darcio Colombo"
            :rows="2"
            :maxlength="MAX_DETALHE"
          />
          <Field>
            <FieldLabel id="rotulo-cor">Destaque</FieldLabel>
            <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="rotulo-cor">
              <button
                v-for="c in CORES_EVENTO"
                :key="c.valor"
                type="button"
                role="radio"
                :aria-checked="form.cor === c.valor"
                class="flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-shadow"
                :class="[AMOSTRA[c.valor], form.cor === c.valor && 'ring-2 ring-primary ring-offset-2 ring-offset-background']"
                @click="form.cor = c.valor"
              >
                {{ c.rotulo }}
              </button>
            </div>
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter class="gap-2 sm:justify-between">
        <Button v-if="evento" variant="ghost" size="lg" class="text-destructive" :disabled="salvando" @click="remover">
          <PhTrash /> Remover
        </Button>
        <div class="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" size="lg" @click="aberto = false">Cancelar</Button>
          <Button type="submit" form="form-evento" size="lg" :disabled="salvando">
            <Spinner v-if="salvando" />
            Salvar
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
