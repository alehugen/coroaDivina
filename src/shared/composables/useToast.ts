import { toast as sonner } from 'vue-sonner'

export type ToastTom = 'success' | 'danger' | 'info'

/** Atalho sobre o Sonner (shadcn) mantendo a API usada no app. */
export function toast(texto: string, tom: ToastTom = 'success') {
  if (tom === 'success') sonner.success(texto)
  else if (tom === 'danger') sonner.error(texto)
  else sonner(texto)
}
