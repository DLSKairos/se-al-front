import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs';

// Configuración HTTPS solo para desarrollo local
const getHttpsConfig = () => {
  try {
    return {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    };
  } catch (e) {
    // En producción o si no existen los certificados, no usar HTTPS
    return false;
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectRegister: false,
      manifest: {
        short_name: "LA CENTRAL",
        name: "LA CENTRAL, super heroes de la construccion",
        icons: [
          {
            src: "icon-192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "icon-512.png",
            type: "image/png",
            sizes: "512x512"
          }
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#1976d2",
        background_color: "#ffffff"
      },
      injectManifest: {
        injectionPoint: undefined,
        swDest: 'sw.js'
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  // Esta configuración solo aplica para desarrollo local (npm run dev)
  // En producción, Render sirve los archivos estáticos con su propio servidor
  server: {
    https: getHttpsConfig(),
    host: 'localhost',
    port: 4000
  }
})
