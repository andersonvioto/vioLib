import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// O VitePWA injeta os assets compilados (HTML, JS, CSS) nesta variável.
// Chamá-la garante a Regressão Zero: A App continua a funcionar offline.
precacheAndRoute(self.__WB_MANIFEST || []);

// Escuta a mensagem de atualização do ReloadPrompt para forçar a instalação do novo SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Estratégia de Cache para Imagens Externas e Nativas
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'violib-images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Dias
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200] // Permite caching opaco de terceiros (CORS)
      })
    ]
  })
);

// Escuta eventos de Push Notification enviados pelo nosso Backend
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/masked-icon.svg',
      data: data.url || '/',
      vibrate: [200, 100, 200]
    };
    event.waitUntil(self.registration.showNotification(data.title || 'vioLib', options));
  }
});

// O que acontece quando o utilizador toca na notificação no telemóvel
// CORREÇÃO LINTER: Usar self.clients em vez de variável global clients
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Se a app já estiver aberta numa aba, foca nela e navega para a URL
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      // Se a app estiver fechada, abre-a na URL especificada no Push
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data);
      }
    })
  );
});
