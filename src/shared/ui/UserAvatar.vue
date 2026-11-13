<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { iniciais } from '@/shared/lib/texto'

const props = defineProps<{ nome: string; size?: 'sm' | 'default' | 'lg' }>()
const texto = computed(() => iniciais(props.nome))
</script>

<template>
  <Avatar :size="size ?? 'lg'" aria-hidden="true">
    <AvatarFallback class="bg-accent font-semibold text-accent-foreground">{{ texto }}</AvatarFallback>
  </Avatar>
</template>
