<script setup lang="ts">
import { PhCheckCircle } from '@phosphor-icons/vue'
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
  type ContextoInscricao,
} from '../../domain/Inscricao'
import AssentosVaga from './AssentosVaga.vue'

const props = defineProps<{ funcao: FuncaoDoDia; ctx: ContextoInscricao; ocupado: Papel | 'cancelando' | null }>()
const emit = defineEmits<{ inscrever: [papel: Papel]; cancelar: [inscricao: Inscricao] }>()

const oc = computed(() => ocupacao(props.funcao))
const minha = computed(() => minhaInscricao(props.funcao, props.ctx.meuId))
const porPapel = (p: Papel) => props.funcao.inscricoes.filter((i) => i.papel === p)

const papeis = computed(() =>
  (['responsavel', 'auxiliar'] as const)
    .map((papel) => ({
      papel,
      vagas: papel === 'responsavel' ? props.funcao.vagasResp : props.funcao.vagasAux,
      inscricoes: porPapel(papel),
      pode: disponibilidade(props.funcao, papel, props.ctx).pode,
    }))
    .filter((p) => p.vagas > 0 || p.inscricoes.length > 0),
)

/** Motivo geral quando ninguém pode entrar (escala fechada, dia passado...), para não deixar os "+" mudos. */
const bloqueio = computed(() => {
  if (minha.value) return null
  const d = disponibilidade(props.funcao, 'auxiliar', props.ctx)
  if (d.pode || d.motivo === 'lotado') return null
  return MOTIVOS[d.motivo]
})

/** Nomes completos, para quem não reconhece só pelas iniciais. */
const nomes = computed(() =>
  [...porPapel('responsavel'), ...porPapel('auxiliar')]
    .map((i) => (i.profileId === props.ctx.meuId ? 'Você' : i.nome))
    .map((n, k) => (k < porPapel('responsavel').length ? `★ ${n}` : n))
    .join(', '),
)
</script>

<template>
  <li class="flex flex-col gap-3 px-4 py-4 sm:px-5">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="font-semibold">{{ funcao.nome }}</p>
        <p class="text-sm text-muted-foreground tabular-nums">{{ oc.total }} de {{ oc.vagas }} lugares ocupados</p>
      </div>
      <Badge v-if="oc.vagas && oc.total >= oc.vagas" class="bg-success/15 text-success">Completa</Badge>
    </div>

    <div class="flex flex-wrap gap-x-6 gap-y-3">
      <AssentosVaga
        v-for="p in papeis"
        :key="p.papel"
        :papel="p.papel"
        :vagas="p.vagas"
        :inscricoes="p.inscricoes"
        :meu-id="ctx.meuId"
        :pode-entrar="p.pode && !ocupado"
        :carregando="ocupado === p.papel"
        :funcao="funcao.nome"
        @entrar="emit('inscrever', p.papel)"
      />
    </div>

    <p v-if="nomes" class="text-sm text-muted-foreground">{{ nomes }}</p>
    <p v-if="bloqueio" class="text-sm font-medium text-muted-foreground">{{ bloqueio }}</p>

    <!-- Já estou nesta função -->
    <div
      v-if="minha"
      class="flex items-center justify-between gap-3 rounded-xl bg-accent px-3 py-2 text-accent-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1"
    >
      <span class="inline-flex items-center gap-2">
        <PhCheckCircle weight="fill" class="size-5 text-primary" />
        Você está como <strong>{{ ROTULO_PAPEL[minha.papel] }}</strong>
      </span>
      <Button
        v-if="podeCancelar(ctx)"
        variant="ghost"
        class="text-destructive hover:text-destructive"
        :disabled="!!ocupado"
        @click="emit('cancelar', minha)"
      >
        <Spinner v-if="ocupado === 'cancelando'" />
        Sair
      </Button>
    </div>
  </li>
</template>
