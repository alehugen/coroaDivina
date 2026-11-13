<script setup lang="ts">
import { PhDeviceMobile, PhExport, PhPlusSquare, PhX } from '@phosphor-icons/vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInstalarApp } from '@/shared/composables/useInstalarApp'
import { toast } from '@/shared/composables/useToast'

/** Faixa convidando a instalar o app + diálogo com o passo a passo do iPhone. */
const { modo, mostrarConvite, instalarNativo, dispensar } = useInstalarApp()
const passoAPassoIOS = ref(false)

async function instalar() {
  if (modo.value === 'ios') {
    passoAPassoIOS.value = true
    return
  }
  const ok = await instalarNativo()
  if (ok) toast('Pronto! O app foi adicionado à sua tela inicial.')
}

defineExpose({ instalar })
</script>

<template>
  <div
    v-if="mostrarConvite"
    class="flex items-center gap-3 border-b bg-accent px-4 py-2.5 text-sm text-accent-foreground sm:px-6"
    role="region"
    aria-label="Instalar o aplicativo"
  >
    <PhDeviceMobile class="size-6 shrink-0 text-primary" />
    <p class="flex-1">
      <strong>Instale o app no celular</strong>
      <span class="hidden sm:inline"> para abrir as escalas direto da tela inicial.</span>
    </p>
    <Button size="lg" @click="instalar">Instalar</Button>
    <Button variant="ghost" size="icon-lg" aria-label="Agora não" @click="dispensar"><PhX /></Button>
  </div>

  <Dialog v-model:open="passoAPassoIOS">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Instalar no iPhone</DialogTitle>
        <DialogDescription>Use o Safari e siga os passos:</DialogDescription>
      </DialogHeader>
      <ol class="flex flex-col gap-4 text-base">
        <li class="flex items-start gap-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">1</span>
          <span>
            Toque no botão <strong>Compartilhar</strong>
            <PhExport class="inline size-5 align-text-bottom text-primary" /> na barra do Safari.
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">2</span>
          <span>
            Role e toque em <strong>Adicionar à Tela de Início</strong>
            <PhPlusSquare class="inline size-5 align-text-bottom text-primary" />.
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">3</span>
          <span>Toque em <strong>Adicionar</strong>. O ícone “Escalas” vai aparecer na sua tela.</span>
        </li>
      </ol>
      <DialogFooter>
        <Button size="lg" class="w-full" @click="passoAPassoIOS = false">Entendi</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
