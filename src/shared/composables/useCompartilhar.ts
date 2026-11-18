import type { Ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { toast } from './useToast'

/** Links muito longos falham ao abrir; acima disso (margem conservadora) o texto vai pela área de transferência. */
const MAX_LINK_WHATSAPP = 4000

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

  async function abrirWhatsApp() {
    const link = `https://wa.me/?text=${encodeURIComponent(texto.value)}`
    if (link.length <= MAX_LINK_WHATSAPP) {
      window.open(link, '_blank', 'noopener')
      return
    }
    try {
      await navigator.clipboard.writeText(texto.value)
      toast('A mensagem é longa, então foi copiada. Abra o WhatsApp e cole na conversa.')
    } catch {
      toast('A mensagem é longa demais para abrir direto. Use "Imprimir / PDF".', 'danger')
    }
  }

  const imprimir = () => window.print()

  /** Volta para a tela anterior; aberta direto por link (sem histórico), vai para `voltarPara`. */
  function voltar() {
    if (window.history.state?.back) router.back()
    else router.push(voltarPara())
  }

  return { copiar, abrirWhatsApp, imprimir, voltar }
}
