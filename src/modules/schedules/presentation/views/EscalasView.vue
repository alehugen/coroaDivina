<script setup lang="ts">
import { EmptyState } from '@/shared/ui'
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold text-text">Escalas abertas</h1>
    <!-- Fase 7: lista de escalas + grade de inscrição -->
    <EmptyState
      titulo="Nenhuma escala aberta no momento"
      descricao="Quando a Orgã abrir uma nova escala, ela aparecerá aqui para você escolher suas funções."
    />
  </div>
</template>
