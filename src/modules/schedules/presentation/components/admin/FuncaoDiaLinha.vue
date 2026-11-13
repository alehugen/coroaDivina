<script setup lang="ts">
import { PhStar, PhTrash } from '@phosphor-icons/vue'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MAX_VAGAS } from '@/modules/catalog'
import { confirmar } from '@/shared/composables/useConfirm'
import { VagasInput } from '@/shared/ui'
import { escalas } from '../../..'
import { ocupacao, type FuncaoDoDia } from '../../../domain/Escala'
import { useEscalaEditorStore } from '../../stores/escalaEditor'

const props = defineProps<{ funcao: FuncaoDoDia }>()
const store = useEscalaEditorStore()

const oc = computed(() => ocupacao(props.funcao))
const responsaveis = computed(() => props.funcao.inscricoes.filter((i) => i.papel === 'responsavel'))
const auxiliares = computed(() => props.funcao.inscricoes.filter((i) => i.papel === 'auxiliar'))

async function alternarAtiva(ativa: boolean) {
  if (!ativa && oc.value.total) {
    const ok = await confirmar({
      titulo: `Desativar "${props.funcao.nome}" neste dia?`,
      mensagem: `Há ${oc.value.total} inscrito(s). Eles continuam registrados, mas a função some da grade dos sócios.`,
      confirmar: 'Desativar',
      tom: 'danger',
    })
    if (!ok) return
  }
  await store.atualizarFuncao(props.funcao.id, { ativa })
}

async function remover() {
  const ok = await confirmar({
    titulo: `Remover "${props.funcao.nome}" deste dia?`,
    mensagem: oc.value.total
      ? `As ${oc.value.total} inscrição(ões) nessa função também serão removidas.`
      : 'A função só será removida deste dia.',
    confirmar: 'Remover',
    tom: 'danger',
  })
  if (ok) await store.executar(() => escalas.removerFuncao(props.funcao.id), 'Função removida do dia.')
}

function atualizarVagas(campo: 'vagasResp' | 'vagasAux', valor: number) {
  if (Number.isFinite(valor) && valor !== props.funcao[campo]) store.atualizarFuncao(props.funcao.id, { [campo]: valor })
}
</script>

<template>
  <li class="flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center">
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <Switch
        class="mt-0.5"
        :model-value="funcao.ativa"
        :aria-label="`${funcao.nome}: ${funcao.ativa ? 'ativa' : 'inativa'} neste dia`"
        @update:model-value="alternarAtiva"
      />
      <div class="min-w-0 flex-1" :class="!funcao.ativa && 'opacity-50'">
        <p class="font-medium" :class="!funcao.ativa && 'line-through'">
          {{ funcao.nome }}
          <span class="ml-1 text-sm font-normal text-muted-foreground tabular-nums">{{ oc.total }}/{{ oc.vagas }}</span>
        </p>
        <div v-if="funcao.inscricoes.length" class="mt-1.5 flex flex-wrap gap-1">
          <Badge v-for="i in responsaveis" :key="i.id" class="bg-accent text-accent-foreground" title="Responsável">
            <PhStar weight="fill" data-icon="inline-start" /> {{ i.nome }}
          </Badge>
          <Badge v-for="i in auxiliares" :key="i.id" variant="secondary">{{ i.nome }}</Badge>
        </div>
        <p v-else-if="funcao.ativa" class="mt-0.5 text-xs text-muted-foreground">Ninguém inscrito ainda</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pl-12 lg:pl-0">
      <div class="flex items-center gap-2">
        <span class="w-8 text-xs font-medium text-muted-foreground">Resp</span>
        <VagasInput
          :model-value="funcao.vagasResp"
          :rotulo="`vagas de responsável em ${funcao.nome}`"
          :min="oc.resp"
          :max="MAX_VAGAS"
          :disabled="!funcao.ativa"
          @update:model-value="atualizarVagas('vagasResp', $event)"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="w-8 text-xs font-medium text-muted-foreground">Aux</span>
        <VagasInput
          :model-value="funcao.vagasAux"
          :rotulo="`vagas de auxiliar em ${funcao.nome}`"
          :min="oc.aux"
          :max="MAX_VAGAS"
          :disabled="!funcao.ativa"
          @update:model-value="atualizarVagas('vagasAux', $event)"
        />
      </div>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="ghost" size="icon-lg" class="hover:text-destructive" aria-label="Remover função deste dia" @click="remover">
            <PhTrash class="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Remover deste dia</TooltipContent>
      </Tooltip>
    </div>
  </li>
</template>
