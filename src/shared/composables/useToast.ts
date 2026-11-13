import { readonly, ref } from 'vue'

export type ToastTom = 'success' | 'danger' | 'info'
interface Toast {
  id: number
  texto: string
  tom: ToastTom
}

const toasts = ref<Toast[]>([])
let seq = 0

export function toast(texto: string, tom: ToastTom = 'success', duracaoMs = 4000) {
  const id = ++seq
  toasts.value.push({ id, texto, tom })
  setTimeout(() => fecharToast(id), duracaoMs)
}

export function fecharToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export const useToasts = () => readonly(toasts)
