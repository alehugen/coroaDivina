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

/**
 * O AlertDialogAction do Reka fecha o diálogo (update:open=false) ANTES do nosso @click.
 * Por isso o "fechou = cancelou" é adiado: se o clique foi em Confirmar, ele já respondeu
 * `true` e esta resposta vira no-op. Esc/Cancelar continuam resolvendo `false`.
 */
function aoMudarAberto(aberto: boolean) {
  if (aberto) return
  const fechado = pendente.value
  setTimeout(() => {
    // Só cancela o diálogo que foi fechado (não um novo aberto logo em seguida)
    if (pendente.value && pendente.value === fechado) responderConfirmacao(false)
  })
}
</script>

<template>
  <AlertDialog :open="!!pendente" @update:open="aoMudarAberto">
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
