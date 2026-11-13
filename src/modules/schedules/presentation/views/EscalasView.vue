<script setup lang="ts">
import { PhCalendarBlank } from '@phosphor-icons/vue'
import { EmptyState } from '@/shared/ui'
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Escalas abertas</h1>
    <!-- Próxima fase: lista de escalas + grade de inscrição -->
    <EmptyState
      :icone="PhCalendarBlank"
      titulo="Nenhuma escala aberta no momento"
      descricao="Quando a Orgã abrir uma nova escala, ela aparecerá aqui para você escolher suas funções."
    />
  </div>
</template>
