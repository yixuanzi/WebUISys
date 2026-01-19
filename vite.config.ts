import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  base: './',
  build: {
    rollupOptions: {
      input: {
        'src/popup/index': './src/popup/index.html',
        'src/txtonline/index': './src/txtonline/index.html',
        'src/save-images/index': './src/save-images/index.html',
        'src/background/service-worker': './src/background/service-worker.ts',
      }
    }
  }
})
