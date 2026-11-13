<script setup lang="ts">
import { computed } from 'vue'
import { iniciais } from '@/shared/lib/texto'

const props = defineProps<{ nome: string }>()
const texto = computed(() => iniciais(props.nome))
</script>

<template>
  <span
    class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
    aria-hidden="true"
  >
    {{ texto }}
  </span>
</template>
