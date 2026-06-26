import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Garante que o usuário receba a versão mais recente ao recarregar
      registerType: 'autoUpdate', 
      
      // Arquivos básicos que sempre devem estar em cache
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      
      // O Manifesto que dita como o celular lerá o seu app
      manifest: {
        id: '/', 
        name: 'vioLib - Gestão de Biblioteca',
        short_name: 'vioLib',
        description: 'Seu sistema pessoal de gestão de biblioteca',
        theme_color: '#1a1a1a', 
        background_color: '#1a1a1a', 
        display: 'standalone', 
        orientation: 'portrait', 
        dir: 'ltr', // Direção do texto (Left-to-Right)
        
        // Categorias para ajudar nas lojas de aplicativos (SEO)
        categories: ['books', 'education', 'productivity'],

        // Atalhos ao segurar o ícone do aplicativo no celular
        shortcuts: [
          {
            name: 'Adicionar Livro',
            short_name: 'Novo Livro',
            description: 'Cadastrar uma nova obra na biblioteca',
            url: '/novo-livro', // A rota do React para onde o usuário será levado
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] // Reutilizamos o ícone
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
  ],
});