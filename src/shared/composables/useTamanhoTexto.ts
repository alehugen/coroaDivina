import { useLocalStorage } from '@vueuse/core'
import { watchEffect } from 'vue'

/** Chave também lida no index.html, para aplicar antes do primeiro paint. */
const CHAVE = 'escalas-texto-grande'

const textoGrande = useLocalStorage<boolean>(CHAVE, false)

let aplicando = false

/** Preferência "Texto maior", guardada neste aparelho. */
export function useTamanhoTexto() {
  if (!aplicando) {
    aplicando = true
    watchEffect(() => document.documentElement.classList.toggle('texto-grande', textoGrande.value))
  }
  return { textoGrande }
}
