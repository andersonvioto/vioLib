const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

/**
 * Inicializa e configura o servidor WebSocket.
 * Implementa autenticação JWT e roteamento isolado por "salas" de usuário.
 */
exports.initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Ajuste em produção para a URL exata do frontend
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  // Middleware de Autenticação para conexões WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Acesso negado. Token de autenticação ausente.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      return next(new Error('Acesso negado. Token inválido ou expirado.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Usuário conectado ao WebSocket: ID ${socket.userId}`);

    // Coloca o utilizador numa sala exclusiva (Room) baseada no seu ID
    // Isto garante que as notificações sejam enviadas de forma privada
    const userRoom = `user_${socket.userId}`;
    socket.join(userRoom);

    socket.on('disconnect', () => {
      console.log(`🔌 Usuário desconectado do WebSocket: ID ${socket.userId}`);
    });
  });

  return io;
};
