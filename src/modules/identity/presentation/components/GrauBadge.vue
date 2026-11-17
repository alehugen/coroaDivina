<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NOME_GRAU, type Grau } from '../../domain/Grau'

/** Sigla do grau (QS, CI, CDC, QM); o nome completo aparece no tooltip — também ao tocar, no celular. */
defineProps<{ grau: Grau }>()

const aberto = ref(false)

const ESTILO: Record<Grau, string> = {
  QS: 'border-border bg-transparent text-muted-foreground',
  CI: 'bg-secondary text-secondary-foreground',
  CDC: 'bg-accent text-accent-foreground',
  QM: 'border-primary bg-transparent text-primary',
}
</script>

<template>
  <Tooltip v-model:open="aberto">
    <TooltipTrigger as-child>
      <button
        type="button"
        class="inline-flex rounded-4xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        :aria-label="NOME_GRAU[grau]"
        @click.stop="aberto = !aberto"
      >
        <Badge :class="['font-semibold tracking-wide', ESTILO[grau]]">{{ grau }}</Badge>
      </button>
    </TooltipTrigger>
    <TooltipContent>{{ NOME_GRAU[grau] }}</TooltipContent>
  </Tooltip>
</template>
