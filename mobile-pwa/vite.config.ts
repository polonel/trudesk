import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import compression from 'vite-plugin-compression'

export default defineConfig({
  base: '/mobile/',
  plugins: [
    // SPA fallback for dev: /mobile → /mobile/ and any unmatched /mobile/* → index.html
    {
      name: 'mobile-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && /^\/mobile(\/(?!@|src|node_modules|__vite)[^.]*)?$/.test(req.url)) {
            req.url = '/mobile/'
          }
          next()
        })
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: '/mobile/',
      manifest: {
        name: 'Trudesk',
        short_name: 'Trudesk',
        description: 'Trudesk Mobile',
        display: 'standalone',
        start_url: '/mobile/',
        scope: '/mobile/',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        icons: [
          { src: '/mobile/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/mobile/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/mobile/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/mobile/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/v2\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
    compression({ algorithm: 'gzip', ext: '.gz' }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/v2': {
        target: 'http://localhost:8118',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
      '/socket.io': {
        target: 'http://localhost:8118',
        changeOrigin: true,
        ws: true,
        cookieDomainRewrite: 'localhost',
      },
      '/verifymfa': {
        target: 'http://localhost:8118',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
