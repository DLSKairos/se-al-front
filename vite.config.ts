/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
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

/**
 * Fix seguridad H1/#8: inyecta una Content-Security-Policy estricta SOLO en el
 * build de producción (en dev rompería el HMR de Vite, que requiere inline/eval
 * y websockets locales). Reduce el impacto de un XSS futuro (el JWT vive en
 * localStorage) impidiendo la ejecución de scripts arbitrarios y la
 * exfiltración a hosts no permitidos.
 *
 * connect-src incluye el origen del API (VITE_API_URL) y su variante websocket
 * (socket.io) además de nominatim (geocoding). img-src permite tiles de OSM,
 * marcadores de unpkg y las imágenes/firmas servidas por Cloudinary.
 */
function cspPlugin(apiUrl: string): Plugin {
  let apiOrigin = ''
  let wsOrigin = ''
  try {
    if (apiUrl) {
      const u = new URL(apiUrl)
      apiOrigin = u.origin
      wsOrigin = `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`
    }
  } catch {
    /* VITE_API_URL inválida o ausente → solo 'self' */
  }

  const connectSrc = [
    "'self'",
    apiOrigin,
    wsOrigin,
    'https://nominatim.openstreetmap.org',
  ].filter(Boolean)

  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    // Estilos inline (React style={{}} + Tailwind) y CSS de Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src \'self\' https://fonts.gstatic.com data:',
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com https://res.cloudinary.com https://*.cloudinary.com",
    `connect-src ${connectSrc.join(' ')}`,
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ')

  return {
    name: 'senal-inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `    <meta http-equiv="Content-Security-Policy" content="${policy}" />\n  </head>`,
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
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
    cspPlugin(env.VITE_API_URL),
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
    env: { VITE_API_URL: 'https://localhost:3000/api' },
    exclude: ['node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/router/**', 'src/config/**'],
    },
  },
  }
})
