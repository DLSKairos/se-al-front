/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

const getHttpsConfig = () => {
  try {
    return {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    }
  } catch {
    return false
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectRegister: 'auto',
      manifest: {
        short_name: 'SEÑAL',
        name: 'SEÑAL — Sistema de Gestión de Seguridad',
        description: 'Sistema de gestión operativa y seguridad laboral',
        lang: 'es',
        categories: ['productivity', 'business'],
        icons: [
          { src: 'icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any maskable' },
          { src: 'icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any maskable' },
        ],
        start_url: '/',
        display: 'standalone',
        theme_color: '#0C1624',
        background_color: '#0C1624',
      },
      injectManifest: {
        injectionPoint: undefined,
        swDest: 'sw.js',
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
  server: {
    https: getHttpsConfig(),
    host: 'localhost',
    port: 4000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/router/**', 'src/config/**'],
    },
  },
})
