<script setup lang="ts">
import { BaseBadge } from '@/shared/ui'
import { STATUS_INFO, type StatusEscala } from '../../domain/Escala'

defineProps<{ status: StatusEscala }>()
</script>

<template>
  <BaseBadge :tone="STATUS_INFO[status].tom">{{ STATUS_INFO[status].rotulo }}</BaseBadge>
</template>
