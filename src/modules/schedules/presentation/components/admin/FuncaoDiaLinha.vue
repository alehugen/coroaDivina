<script setup lang="ts">
import { PhStar, PhTrash, PhUserPlus, PhX } from '@phosphor-icons/vue'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MAX_VAGAS } from '@/modules/catalog'
import { confirmar } from '@/shared/composables/useConfirm'
import { VagasInput } from '@/shared/ui'
import { escalas } from '../../..'
import { ocupacao, type FuncaoDoDia, type Inscricao } from '../../../domain/Escala'
import { useEscalaAtualStore } from '../../stores/escalaAtual'
import AdicionarPessoaDialog from './AdicionarPessoaDialog.vue'

const props = defineProps<{ funcao: FuncaoDoDia }>()
const store = useEscalaAtualStore()

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

const modalPessoa = ref(false)

async function removerPessoa(i: Inscricao) {
  const ok = await confirmar({
    titulo: `Remover ${i.nome} de ${props.funcao.nome}?`,
    mensagem: 'A vaga fica livre para outra pessoa.',
    confirmar: 'Remover',
    tom: 'danger',
  })
  if (ok) await store.executar(() => escalas.cancelarInscricao(i.id), `${i.nome} removido(a) da função.`)
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
        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            v-for="i in [...responsaveis, ...auxiliares]"
            :key="i.id"
            class="inline-flex h-8 items-center gap-1 rounded-full pr-0.5 pl-2.5 text-sm"
            :class="i.papel === 'responsavel' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'"
            :title="i.papel === 'responsavel' ? 'Responsável' : 'Auxiliar'"
          >
            <PhStar v-if="i.papel === 'responsavel'" weight="fill" class="size-3.5" />
            {{ i.nome }}
            <button
              type="button"
              class="flex size-7 items-center justify-center rounded-full hover:bg-foreground/10"
              :aria-label="`Remover ${i.nome}`"
              @click="removerPessoa(i)"
            >
              <PhX class="size-3.5" />
            </button>
          </span>
          <Button
            v-if="funcao.ativa && oc.total < oc.vagas"
            variant="ghost"
            size="sm"
            class="text-primary"
            @click="modalPessoa = true"
          >
            <PhUserPlus /> Incluir pessoa
          </Button>
          <span v-else-if="!funcao.inscricoes.length && funcao.ativa" class="text-xs text-muted-foreground">
            Sem vagas
          </span>
        </div>
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
    <AdicionarPessoaDialog v-model="modalPessoa" :funcao="funcao" />
  </li>
</template>
