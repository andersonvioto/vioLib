import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],

      // Configuração avançada do Service Worker (Workbox)
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html'
      },

      manifest: {
        id: '/',
        name: 'vioLib - Gestão de Biblioteca',
        short_name: 'vioLib',
        description: 'Seu sistema pessoal de gestão de biblioteca',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'ltr',

        categories: ['books', 'education', 'productivity'],

        shortcuts: [
          {
            name: 'Adicionar Livro',
            short_name: 'Novo Livro',
            description: 'Cadastrar uma nova obra na biblioteca',
            url: '/novo-livro',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Minha Biblioteca',
            short_name: 'Biblioteca',
            description: 'Ver todas as minhas obras',
            url: '/biblioteca',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ],

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],

        screenshots: [
          {
            src: '/screenshot-narrow.png',
            sizes: '720x1280',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
      }
    })
  ]
});
