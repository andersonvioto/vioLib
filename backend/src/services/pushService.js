const webpush = require('web-push');
const { PushSubscription } = require('../models');

// Configure via .env
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails('mailto:suporte@violib.com.br', publicVapidKey, privateVapidKey);
}

/**
 * Envia uma Notificação Web Push Nativa para todos os dispositivos subscritos de um utilizador.
 */
exports.sendPushNotification = async (userId, payload) => {
  if (!publicVapidKey || !privateVapidKey) {
    console.warn('⚠️ Push notifications ignoradas: VAPID Keys não configuradas.');
    return;
  }

  try {
    const subscriptions = await PushSubscription.findAll({ where: { UserId: userId } });

    for (const sub of subscriptions) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: JSON.parse(sub.keys)
      };

      try {
        await webpush.sendNotification(pushConfig, JSON.stringify(payload));
      } catch (err) {
        // Se retornar 410 (Gone) ou 404 (Not Found), significa que o utilizador
        // removeu a permissão no browser ou limpou a cache agressivamente.
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log('🗑️ Removendo subscrição fantasma do banco de dados...');
          await sub.destroy();
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro no Serviço de Push:', error);
  }
};
