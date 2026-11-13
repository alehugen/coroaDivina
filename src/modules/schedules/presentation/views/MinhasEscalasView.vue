<script setup lang="ts">
import { EmptyState } from '@/shared/ui'
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold text-text">Minhas escalas</h1>
    <!-- Fase 7: inscrições futuras do sócio, com opção de cancelar -->
    <EmptyState
      titulo="Você ainda não está em nenhuma escala"
      descricao="Escolha suas funções na aba Escalas."
    />
  </div>
</template>
