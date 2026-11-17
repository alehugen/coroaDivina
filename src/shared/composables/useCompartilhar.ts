import type { Ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { toast } from './useToast'

/** Ações das telas de impressão: copiar o texto, abrir no WhatsApp, imprimir e voltar. */
export function useCompartilhar(texto: Ref<string>, voltarPara: () => RouteLocationRaw) {
  const router = useRouter()

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto.value)
      toast('Texto copiado. É só colar no WhatsApp.')
    } catch {
      toast('Não foi possível copiar automaticamente.', 'danger')
    }
  }

  const abrirWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(texto.value)}`, '_blank', 'noopener')

  const imprimir = () => window.print()

  /** Volta para a tela anterior; aberta direto por link (sem histórico), vai para `voltarPara`. */
  function voltar() {
    if (window.history.state?.back) router.back()
    else router.push(voltarPara())
  }

  return { copiar, abrirWhatsApp, imprimir, voltar }
}
