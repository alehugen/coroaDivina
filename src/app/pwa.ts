import { registerSW } from 'virtual:pwa-register'
import type { Router } from 'vue-router'

/**
 * App instalado (principalmente no iPhone) quase nunca é recarregado: ele volta da memória.
 * Procuramos versão nova ao voltar para o app e a cada hora; com `autoUpdate`, o service worker
 * novo assume e a página recarrega sozinha — no momento em que a pessoa volta ao app.
 */
export function registrarPWA() {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registro) {
      if (!registro) return
      const procurar = () => {
        if (navigator.onLine) registro.update().catch(() => {})
      }
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && procurar())
      setInterval(procurar, 60 * 60 * 1000)
    },
  })
}

/**
 * Depois de um deploy, uma aba aberta pode pedir um pedaço (chunk) do código que não existe mais.
 * Em vez de a tela travar, recarrega uma vez direto na rota pedida.
 */
export function recuperarAposDeploy(router: Router) {
  const CHAVE = 'escalas-recarregou-apos-deploy'
  router.onError((erro, destino) => {
    const msg = String((erro as Error)?.message ?? erro)
    if (!/dynamically imported module|Importing a module script failed|error loading dynamically/i.test(msg)) return
    try {
      if (sessionStorage.getItem(CHAVE)) return // já tentou: evita laço
      sessionStorage.setItem(CHAVE, '1')
    } catch {
      /* sem storage: tenta mesmo assim */
    }
    window.location.assign(destino.fullPath)
  })
  router.afterEach(() => {
    try {
      sessionStorage.removeItem(CHAVE)
    } catch {
      /* ignore */
    }
  })
}

/** Cor da barra do sistema (Android/iOS) acompanha o cabeçalho do tema atual. */
export function sincronizarCorDaBarra(escuro: boolean) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro ? '#131c17' : '#ffffff')
}
