<script setup lang="ts">
import { PhPlus, PhStar } from '@phosphor-icons/vue'
import { computed } from 'vue'
import { Spinner } from '@/components/ui/spinner'
import { iniciais } from '@/shared/lib/texto'
import type { Inscricao, Papel } from '../../domain/Escala'
import { ROTULO_PAPEL } from '../../domain/Inscricao'

/**
 * As vagas de um papel como "lugares": ocupados mostram as iniciais de quem está,
 * livres são tracejados com "+" e, quando permitido, inscrevem ao toque.
 */
const props = defineProps<{
  papel: Papel
  vagas: number
  inscricoes: Inscricao[]
  meuId: string
  /** Pode tocar num lugar livre para entrar. */
  podeEntrar: boolean
  carregando: boolean
  funcao: string
}>()
const emit = defineEmits<{ entrar: [] }>()

// Inscritos além das vagas (Orgã reduziu depois) também aparecem
const livres = computed(() => Math.max(0, props.vagas - props.inscricoes.length))
const resp = computed(() => props.papel === 'responsavel')

/** Anima só o lugar que o usuário acabou de ocupar (não a cada abertura da tela). */
const recente = (i: Inscricao) =>
  i.profileId === props.meuId && Date.now() - Date.parse(i.criadoEm) < 15_000
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
      <PhStar v-if="resp" weight="fill" class="size-3.5 text-primary" />
      {{ ROTULO_PAPEL[papel] }}
    </span>
    <div class="flex flex-wrap gap-2">
      <!-- ocupados -->
      <span
        v-for="i in inscricoes"
        :key="i.id"
        class="relative grid size-11 place-items-center rounded-full text-sm font-bold"
        :class="[
          i.profileId === meuId
            ? ['bg-primary text-primary-foreground', recente(i) && 'assento-meu']
            : resp
              ? 'bg-accent text-accent-foreground ring-2 ring-primary ring-inset'
              : 'bg-muted text-foreground',
        ]"
        :title="i.profileId === meuId ? 'Você' : i.nome"
        role="img"
        :aria-label="`${ROTULO_PAPEL[papel]}: ${i.profileId === meuId ? 'você' : i.nome}`"
      >
        {{ iniciais(i.nome) }}
      </span>

      <!-- livres -->
      <button
        v-for="k in livres"
        :key="`livre-${k}`"
        type="button"
        class="grid size-11 place-items-center rounded-full border-2 border-dashed text-primary transition-[transform,background-color] active:scale-90 enabled:hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
        :class="resp ? 'border-primary/70' : 'border-primary/45'"
        :disabled="!podeEntrar || carregando"
        :aria-label="`Entrar como ${ROTULO_PAPEL[papel]} em ${funcao}`"
        @click="emit('entrar')"
      >
        <Spinner v-if="carregando && k === 1" class="size-4" />
        <PhPlus v-else class="size-5" weight="bold" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Ao entrar: o lugar "se enche" com um leve salto e uma onda em volta */
@media (prefers-reduced-motion: no-preference) {
  .assento-meu {
    animation: assento-entrar 0.45s cubic-bezier(0.2, 1.4, 0.4, 1);
  }
  .assento-meu::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 9999px;
    border: 2px solid var(--primary);
    animation: assento-onda 0.7s ease-out forwards;
    pointer-events: none;
  }
}
@keyframes assento-entrar {
  from { transform: scale(0.4); }
  to { transform: scale(1); }
}
@keyframes assento-onda {
  from { opacity: 0.7; transform: scale(0.9); }
  to { opacity: 0; transform: scale(1.45); }
}
</style>
