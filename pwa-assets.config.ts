import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Gera os ícones do PWA a partir de public/icon.svg:  npm run icons
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // Ícones "maskable" (Android) e Apple: fundo verde e respiro para a coroa não ser cortada
    maskable: { sizes: [512], padding: 0.25, resizeOptions: { background: '#007f5f' } },
    apple: { sizes: [180], padding: 0.2, resizeOptions: { background: '#007f5f' } },
  },
  images: ['public/icon.svg'],
})
