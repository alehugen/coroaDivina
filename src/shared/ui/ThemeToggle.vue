<script setup lang="ts">
import { PhDesktop, PhMoon, PhSun } from '@phosphor-icons/vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/shared/composables/useTheme'

const { mode, cycle } = useTheme()
const info = computed(
  () =>
    ({
      light: { icone: PhSun, rotulo: 'Tema claro' },
      dark: { icone: PhMoon, rotulo: 'Tema escuro' },
      auto: { icone: PhDesktop, rotulo: 'Tema do sistema' },
    })[mode.value] ?? { icone: PhDesktop, rotulo: 'Tema do sistema' },
)
</script>

<template>
  <Button
    variant="ghost"
    size="icon-lg"
    :title="info.rotulo"
    :aria-label="`${info.rotulo} (clique para alternar)`"
    @click="cycle"
  >
    <component :is="info.icone" class="size-5" />
  </Button>
</template>
