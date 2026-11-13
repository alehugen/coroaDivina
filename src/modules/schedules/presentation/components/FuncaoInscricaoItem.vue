<script setup lang="ts">
import { PhCheckCircle, PhHandHeart, PhStar } from '@phosphor-icons/vue'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { FuncaoDoDia, Inscricao, Papel } from '../../domain/Escala'
import { ocupacao } from '../../domain/Escala'
import {
  disponibilidade,
  minhaInscricao,
  MOTIVOS,
  podeCancelar,
  ROTULO_PAPEL,
  vagasLivres,
  type ContextoInscricao,
} from '../../domain/Inscricao'

const props = defineProps<{ funcao: FuncaoDoDia; ctx: ContextoInscricao; ocupado: Papel | 'cancelando' | null }>()
const emit = defineEmits<{ inscrever: [papel: Papel]; cancelar: [inscricao: Inscricao] }>()

const oc = computed(() => ocupacao(props.funcao))
const minha = computed(() => minhaInscricao(props.funcao, props.ctx.meuId))
const equipe = computed(() =>
  [...props.funcao.inscricoes].sort((a, b) =>
    a.papel === b.papel ? a.criadoEm.localeCompare(b.criadoEm) : a.papel === 'responsavel' ? -1 : 1,
  ),
)

const PAPEIS: { papel: Papel; icone: typeof PhStar }[] = [
  { papel: 'responsavel', icone: PhStar },
  { papel: 'auxiliar', icone: PhHandHeart },
]

function legenda(papel: Papel) {
  const d = disponibilidade(props.funcao, papel, props.ctx)
  if (!d.pode) return MOTIVOS[d.motivo]
  const n = vagasLivres(props.funcao, papel)
  return `${n} ${n === 1 ? 'vaga' : 'vagas'}`
}
</script>

<template>
  <li class="flex flex-col gap-3 px-4 py-4 sm:px-5">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="font-medium">{{ funcao.nome }}</p>
        <p class="text-xs text-muted-foreground tabular-nums">{{ oc.total }} de {{ oc.vagas }} vagas preenchidas</p>
      </div>
      <Badge v-if="oc.total >= oc.vagas" variant="secondary">Completa</Badge>
    </div>

    <!-- Equipe -->
    <div v-if="equipe.length" class="flex flex-wrap gap-1.5" aria-label="Equipe">
      <Badge
        v-for="i in equipe"
        :key="i.id"
        :variant="i.papel === 'responsavel' ? 'default' : 'secondary'"
        :class="[
          i.papel === 'responsavel' && 'bg-accent text-accent-foreground',
          i.profileId === ctx.meuId && 'ring-2 ring-primary',
        ]"
        :title="ROTULO_PAPEL[i.papel]"
      >
        <PhStar v-if="i.papel === 'responsavel'" weight="fill" data-icon="inline-start" />
        {{ i.profileId === ctx.meuId ? 'Você' : i.nome }}
      </Badge>
    </div>

    <!-- Já estou nesta função -->
    <div v-if="minha" class="flex items-center justify-between gap-3 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
      <span class="inline-flex items-center gap-2">
        <PhCheckCircle weight="fill" class="size-5 text-primary" />
        Você está como <strong>{{ ROTULO_PAPEL[minha.papel] }}</strong>
      </span>
      <Button
        v-if="podeCancelar(ctx)"
        variant="ghost"
        size="sm"
        class="text-destructive hover:text-destructive"
        :disabled="!!ocupado"
        @click="emit('cancelar', minha)"
      >
        <Spinner v-if="ocupado === 'cancelando'" />
        Cancelar
      </Button>
    </div>

    <!-- Escolher papel -->
    <div v-else class="grid grid-cols-2 gap-2">
      <Button
        v-for="p in PAPEIS"
        :key="p.papel"
        variant="outline"
        class="h-auto flex-col items-start gap-0.5 px-3 py-2 text-left whitespace-normal"
        :disabled="!disponibilidade(funcao, p.papel, ctx).pode || !!ocupado"
        @click="emit('inscrever', p.papel)"
      >
        <span class="inline-flex items-center gap-1.5 font-medium">
          <Spinner v-if="ocupado === p.papel" />
          <component :is="p.icone" v-else class="size-4" />
          {{ ROTULO_PAPEL[p.papel] }}
        </span>
        <span class="text-xs font-normal text-muted-foreground">{{ legenda(p.papel) }}</span>
      </Button>
    </div>
  </li>
</template>
