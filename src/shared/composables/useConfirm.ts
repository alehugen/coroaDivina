import { ref } from 'vue'

export interface ConfirmOpcoes {
  titulo: string
  mensagem?: string
  confirmar?: string
  cancelar?: string
  tom?: 'primary' | 'danger'
}

interface ConfirmPendente extends ConfirmOpcoes {
  resolve: (ok: boolean) => void
}

const pendente = ref<ConfirmPendente | null>(null)

/** Abre o diálogo de confirmação global (ConfirmDialogHost). Resolve true se confirmado. */
export function confirmar(opcoes: ConfirmOpcoes): Promise<boolean> {
  pendente.value?.resolve(false)
  return new Promise((resolve) => {
    pendente.value = { ...opcoes, resolve }
  })
}

export function responderConfirmacao(ok: boolean) {
  pendente.value?.resolve(ok)
  pendente.value = null
}

export const useConfirmPendente = () => pendente
