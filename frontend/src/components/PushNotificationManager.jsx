import { useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * Função obrigatória para converter a chave VAPID Base64 num array Uint8
 * que o navegador exige para se inscrever no serviço de Push da Google/Apple.
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Componente invisível que gere a subscrição de Notificações Web Push
 * nativas no telemóvel ou navegador do utilizador.
 */
const PushNotificationManager = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Só tenta registar se o utilizador estiver logado, e o browser suportar Service Workers e Push.
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const subscribeToPush = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (!publicVapidKey) {
            console.warn('VAPID Public Key ausente no .env');
            return;
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        // Envia as credenciais criptográficas únicas deste dispositivo para o nosso Backend
        await api.post('/notifications/subscribe', subscription);
      } catch (error) {
        console.error('Erro na subscrição push (Acesso recusado ou erro técnico):', error);
      }
    };

    // Fluxo de UX: Se for o primeiro acesso, o browser pede permissão com um pop-up.
    // Se a pessoa aceitar, efetuamos a inscrição.
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') subscribeToPush();
      });
    } else if (Notification.permission === 'granted') {
      subscribeToPush();
    }
  }, [user]);

  return null; // Não renderiza nada visualmente.
};

export default PushNotificationManager;
