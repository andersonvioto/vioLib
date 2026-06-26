import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // O 'autoUpdate' garante que o usuário sempre receba a versão mais recente 
      // do seu código quando recarregar o app
      registerType: 'autoUpdate', 
      
      // Arquivos básicos que sempre devem estar em cache
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      
      // O coração do PWA: O Manifesto que dita como o celular lerá o seu app
      manifest: {
        id: '/', // Identificador único absoluto do seu app (Resolve o alerta do PWABuilder)
        name: 'vioLib - Gestão de Biblioteca',
        short_name: 'vioLib',
        description: 'Seu sistema pessoal de gestão de biblioteca',
        theme_color: '#1a1a1a', // A cor da barra de status do celular
        background_color: '#1a1a1a', // A cor de fundo da tela de carregamento (Splash Screen)
        display: 'standalone', // Remove a barra de URL do navegador, parecendo um app nativo
        orientation: 'portrait', // Inicia preferencialmente em pé no celular
        
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
            purpose: 'any maskable' // Garante que o ícone se adapte aos formatos do Android
          }
        ],

        // Telas de demonstração para a janela de instalação (Rich Install UI)
        screenshots: [
          {
            src: '/screenshot-narrow.png',
            sizes: '720x1280',
            type: 'image/png',
            form_factor: 'narrow' // Indica que é a captura de tela do celular (vertical)
          },
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide' // Indica que é a captura de tela do computador (horizontal)
          }
        ]
      }
    })
  ],
});