import { computed, ref } from 'vue'

/** Evento não padronizado do Chrome/Android para instalar o PWA. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const CHAVE_DISPENSA = 'escalas-instalar-dispensado-ate'
const DIAS_DISPENSA = 30

const eventoInstalacao = ref<BeforeInstallPromptEvent | null>(null)
const instalado = ref(false)
const dispensadoAte = ref(lerDispensa())

function lerDispensa(): number {
  try {
    return Number(localStorage.getItem(CHAVE_DISPENSA) ?? 0)
  } catch {
    return 0
  }
}

const emModoApp = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const ehIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPad "desktop"

let ouvindo = false
function ouvir() {
  if (ouvindo || typeof window === 'undefined') return
  ouvindo = true
  instalado.value = emModoApp()
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // guardamos para mostrar nosso próprio convite
    eventoInstalacao.value = e as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    instalado.value = true
    eventoInstalacao.value = null
  })
}

/**
 * Convite para instalar o app na tela inicial.
 * - Android/Chrome: usa o prompt nativo (`beforeinstallprompt`).
 * - iPhone/iPad: não existe prompt; mostramos o passo a passo do Safari.
 */
export function useInstalarApp() {
  ouvir()

  const modo = computed<'nativo' | 'ios' | null>(() => {
    if (instalado.value) return null
    if (eventoInstalacao.value) return 'nativo'
    if (ehIOS()) return 'ios'
    return null
  })

  const mostrarConvite = computed(() => modo.value !== null && Date.now() > dispensadoAte.value)

  async function instalarNativo(): Promise<boolean> {
    const e = eventoInstalacao.value
    if (!e) return false
    await e.prompt()
    const { outcome } = await e.userChoice
    eventoInstalacao.value = null
    return outcome === 'accepted'
  }

  function dispensar() {
    dispensadoAte.value = Date.now() + DIAS_DISPENSA * 24 * 60 * 60 * 1000
    try {
      localStorage.setItem(CHAVE_DISPENSA, String(dispensadoAte.value))
    } catch {
      /* armazenamento indisponível: só não lembra a escolha */
    }
  }

  return { modo, mostrarConvite, instalarNativo, dispensar }
}
