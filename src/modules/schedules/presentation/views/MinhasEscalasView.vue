<script setup lang="ts">
import { PhCalendarCheck } from '@phosphor-icons/vue'
import { EmptyState } from '@/shared/ui'
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Minhas escalas</h1>
    <!-- Próxima fase: inscrições futuras do sócio, com opção de cancelar -->
    <EmptyState
      :icone="PhCalendarCheck"
      titulo="Você ainda não está em nenhuma escala"
      descricao="Escolha suas funções na aba Escalas."
    />
  </div>
</template>
