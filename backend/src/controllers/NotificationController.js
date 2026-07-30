const { Op } = require('sequelize');
const { Notification, User, PushSubscription } = require('../models');

exports.getMyNotifications = async (req, res) => {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    await Notification.destroy({
      where: {
        UserId: req.userId,
        isRead: true,
        createdAt: {
          [Op.lt]: fifteenDaysAgo
        }
      }
    });

    const notifications = await Notification.findAll({
      where: { UserId: req.userId },
      include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'username', 'avatarUrl'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json(notifications);
  } catch (error) {
    console.error('❌ Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao carregar notificações.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOne({ where: { id, UserId: req.userId } });

    if (!notif) return res.status(404).json({ error: 'Notificação não encontrada.' });

    notif.isRead = true;
    await notif.save();

    res.json({ message: 'Marcada como lida.' });
  } catch (error) {
    console.error('❌ Erro ao marcar notificação:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { UserId: req.userId, isRead: false } });
    res.json({ message: 'Todas as notificações foram marcadas como lidas.' });
  } catch (error) {
    console.error('❌ Erro ao limpar notificações:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
};

exports.subscribePush = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys) {
      return res.status(400).json({ error: 'Payload de subscrição inválido' });
    }

    const userSubscriptions = await PushSubscription.findAll({
      where: { UserId: req.userId }
    });

    let existingSub = userSubscriptions.find((s) => s.endpoint === endpoint);

    if (existingSub) {
      existingSub.keys = JSON.stringify(keys);
      await existingSub.save();
    } else {
      await PushSubscription.create({
        endpoint,
        keys: JSON.stringify(keys),
        UserId: req.userId
      });
    }

    res.status(201).json({ message: 'Dispositivo registado para Push com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao assinar push:', error);
    res.status(500).json({ error: 'Erro interno ao assinar notificações.' });
  }
};
