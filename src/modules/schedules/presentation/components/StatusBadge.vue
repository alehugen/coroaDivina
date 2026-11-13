<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { STATUS_INFO, type StatusEscala } from '../../domain/Escala'

const props = defineProps<{ status: StatusEscala }>()

const classes = computed(
  () =>
    ({
      rascunho: 'bg-muted text-muted-foreground',
      aberta: 'bg-primary text-primary-foreground',
      fechada: 'bg-warning-soft text-warning',
      arquivada: 'bg-muted text-muted-foreground',
    })[props.status],
)
</script>

<template>
  <Badge :class="classes">{{ STATUS_INFO[status].rotulo }}</Badge>
</template>
