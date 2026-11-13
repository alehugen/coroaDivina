<script setup lang="ts">
import { computed } from 'vue'
import { MAX_VAGAS } from '@/modules/catalog'
import { confirmar } from '@/shared/composables/useConfirm'
import { BaseSwitch, IconButton, NumberInput } from '@/shared/ui'
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
</script>

<template>
  <li class="flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center">
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <BaseSwitch
        class="mt-0.5"
        :model-value="funcao.ativa"
        :rotulo="`${funcao.nome} ${funcao.ativa ? 'ativa' : 'inativa'} neste dia`"
        @update:model-value="alternarAtiva"
      />
      <div class="min-w-0 flex-1" :class="!funcao.ativa && 'opacity-50'">
        <p class="font-medium text-text" :class="!funcao.ativa && 'line-through'">
          {{ funcao.nome }}
          <span class="ml-1 text-sm font-normal text-muted">{{ oc.total }}/{{ oc.vagas }}</span>
        </p>
        <p v-if="funcao.inscricoes.length" class="mt-1 flex flex-wrap gap-1 text-xs">
          <span
            v-for="i in responsaveis"
            :key="i.id"
            class="rounded-full bg-primary-soft px-2 py-0.5 font-medium text-primary"
            title="Responsável"
          >
            ★ {{ i.nome }}
          </span>
          <span v-for="i in auxiliares" :key="i.id" class="rounded-full bg-surface-2 px-2 py-0.5 text-text">
            {{ i.nome }}
          </span>
        </p>
        <p v-else-if="funcao.ativa" class="mt-0.5 text-xs text-muted">Ninguém inscrito ainda</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 pl-12 lg:pl-0">
      <div class="flex items-center gap-2">
        <span class="w-8 text-xs font-medium text-muted" title="Vagas de responsável">Resp</span>
        <NumberInput
          :model-value="funcao.vagasResp"
          :rotulo="`vagas de responsável em ${funcao.nome}`"
          :min="oc.resp"
          :max="MAX_VAGAS"
          :disabled="!funcao.ativa"
          @update:model-value="store.atualizarFuncao(funcao.id, { vagasResp: $event })"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="w-8 text-xs font-medium text-muted" title="Vagas de auxiliar">Aux</span>
        <NumberInput
          :model-value="funcao.vagasAux"
          :rotulo="`vagas de auxiliar em ${funcao.nome}`"
          :min="oc.aux"
          :max="MAX_VAGAS"
          :disabled="!funcao.ativa"
          @update:model-value="store.atualizarFuncao(funcao.id, { vagasAux: $event })"
        />
      </div>
      <IconButton rotulo="Remover função deste dia" perigo @click="remover">🗑</IconButton>
    </div>
  </li>
</template>
