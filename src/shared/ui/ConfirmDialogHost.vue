<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { responderConfirmacao, useConfirmPendente } from '@/shared/composables/useConfirm'

/** Diálogo de confirmação global, acionado por `confirmar()` (useConfirm). */
const pendente = useConfirmPendente()
</script>

<template>
  <AlertDialog :open="!!pendente" @update:open="(v) => !v && responderConfirmacao(false)">
    <AlertDialogContent v-if="pendente">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ pendente.titulo }}</AlertDialogTitle>
        <AlertDialogDescription v-if="pendente.mensagem">{{ pendente.mensagem }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="responderConfirmacao(false)">
          {{ pendente.cancelar ?? 'Cancelar' }}
        </AlertDialogCancel>
        <AlertDialogAction
          :variant="pendente.tom === 'danger' ? 'destructive' : 'default'"
          @click="responderConfirmacao(true)"
        >
          {{ pendente.confirmar ?? 'Confirmar' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
