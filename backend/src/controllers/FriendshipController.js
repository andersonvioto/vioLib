const { Op } = require('sequelize');
const { User, Friendship, Notification } = require('../models');
const pushService = require('../services/pushService');

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Termo de pesquisa inválido.' });
    }

    // HIGIENIZAÇÃO INTELIGENTE: Remove espaços nas pontas e o '@' inicial, se existir.
    const cleanQuery = q.trim().replace(/^@/, '');

    if (cleanQuery.length < 3) {
      return res
        .status(400)
        .json({ error: 'Digite pelo menos 3 caracteres válidos para pesquisar.' });
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.userId },
        [Op.or]: [
          { username: { [Op.like]: `%${cleanQuery.toLowerCase()}%` } },
          { name: { [Op.like]: `%${cleanQuery}%` } }
        ]
      },
      attributes: ['id', 'name', 'username', 'avatarUrl']
    });

    res.json(users);
  } catch (error) {
    console.error('❌ Erro ao pesquisar utilizadores:', error);
    res.status(500).json({ error: 'Erro ao buscar utilizadores.' });
  }
};

exports.sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const requesterId = req.userId;

    if (requesterId === parseInt(receiverId, 10)) {
      return res.status(400).json({ error: 'Não pode enviar um convite a si mesmo.' });
    }

    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId }
        ]
      }
    });

    if (existingFriendship) {
      return res
        .status(400)
        .json({ error: 'Já existe uma conexão ou pedido pendente com este utilizador.' });
    }

    const friendship = await Friendship.create({ requesterId, receiverId, status: 'pending' });

    const notification = await Notification.create({
      type: 'friend_request',
      UserId: receiverId,
      senderId: requesterId,
      referenceId: requesterId
    });

    const sender = await User.findByPk(requesterId);

    // EMISSÃO SOCKET
    if (req.io) {
      req.io.to(`user_${receiverId}`).emit('new_notification', notification);
    }

    // EMISSÃO WEB PUSH NATIVA (Ativa o telemóvel)
    await pushService.sendPushNotification(receiverId, {
      title: 'Novo Pedido de Amizade!',
      body: `${sender.name} enviou um convite.`,
      url: `${process.env.FRONTEND_URL || 'https://violib.com.br'}/comunidade`
    });

    res.status(201).json({ message: 'Pedido de amizade enviado com sucesso!', friendship });
  } catch (error) {
    console.error('❌ Erro ao enviar pedido de amizade:', error);
    res.status(500).json({ error: 'Erro ao enviar pedido.' });
  }
};

exports.respondRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { accept } = req.body;

    const friendship = await Friendship.findOne({
      where: { id: friendshipId, receiverId: req.userId, status: 'pending' }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Pedido não encontrado ou já processado.' });
    }

    if (accept) {
      friendship.status = 'accepted';
      await friendship.save();

      const notification = await Notification.create({
        type: 'friend_accepted',
        UserId: friendship.requesterId,
        senderId: req.userId,
        referenceId: req.userId
      });

      const accepter = await User.findByPk(req.userId);

      // EMISSÃO SOCKET E PUSH
      if (req.io) {
        req.io.to(`user_${friendship.requesterId}`).emit('new_notification', notification);
      }

      await pushService.sendPushNotification(friendship.requesterId, {
        title: 'Pedido Aceite!',
        body: `${accepter.name} agora faz parte da sua rede.`,
        url: `${process.env.FRONTEND_URL || 'https://violib.com.br'}/perfil/${req.userId}`
      });

      res.json({ message: 'Pedido aceite com sucesso!', friendship });
    } else {
      await friendship.destroy();
      res.json({ message: 'Pedido recusado.' });
    }
  } catch (error) {
    console.error('❌ Erro ao processar pedido de amizade:', error);
    res.status(500).json({ error: 'Erro ao processar o pedido.' });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.userId;

    const deleted = await Friendship.destroy({
      where: {
        [Op.or]: [
          { requesterId: userId, receiverId: friendId },
          { requesterId: friendId, receiverId: userId }
        ]
      }
    });

    if (deleted === 0) return res.status(404).json({ error: 'Conexão não encontrada.' });
    res.json({ message: 'Amizade desfeita com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao remover amigo:', error);
    res.status(500).json({ error: 'Erro ao remover amigo.' });
  }
};

exports.listFriends = async (req, res) => {
  try {
    const userId = req.userId;
    const connections = await Friendship.findAll({
      where: { [Op.or]: [{ requesterId: userId }, { receiverId: userId }] },
      include: [
        { model: User, as: 'Requester', attributes: ['id', 'name', 'username', 'avatarUrl'] },
        { model: User, as: 'Receiver', attributes: ['id', 'name', 'username', 'avatarUrl'] }
      ]
    });

    const friends = [];
    const pendingSent = [];
    const pendingReceived = [];

    connections.forEach((conn) => {
      const isRequester = conn.requesterId === userId;
      const targetUser = isRequester ? conn.Receiver : conn.Requester;

      const payload = { friendshipId: conn.id, user: targetUser, since: conn.updatedAt };

      if (conn.status === 'accepted') friends.push(payload);
      else if (conn.status === 'pending') {
        if (isRequester) pendingSent.push(payload);
        else pendingReceived.push(payload);
      }
    });

    res.json({ friends, pendingSent, pendingReceived });
  } catch (error) {
    console.error('❌ Erro ao listar comunidade:', error);
    res.status(500).json({ error: 'Erro ao listar a comunidade.' });
  }
};
