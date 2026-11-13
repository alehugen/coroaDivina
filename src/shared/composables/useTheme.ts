import { useColorMode } from '@vueuse/core'
import { computed } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

/** Tema claro/escuro/sistema. A chave do storage é lida também no index.html. */
export function useTheme() {
  const mode = useColorMode({
    storageKey: 'escalas-theme',
    emitAuto: true,
    disableTransition: false,
  })

  const isDark = computed(() => mode.state.value === 'dark')
  const order: ThemeMode[] = ['light', 'dark', 'auto']

  function cycle() {
    const atual = (mode.store.value as ThemeMode) ?? 'auto'
    mode.value = order[(order.indexOf(atual) + 1) % order.length]!
  }

  return { mode: mode.store, isDark, cycle }
}
