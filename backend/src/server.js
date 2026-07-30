const express = require('express');
require('dotenv').config();
const { sequelize } = require('./models');
const cors = require('cors');
const http = require('http'); // Necessário para acoplar o Express ao Socket.io
const { initSocket } = require('./socket');

const app = express();

// Criação do servidor HTTP puro passando o Express
const server = http.createServer(app);

// Inicialização do motor de WebSocket
const io = initSocket(server);

app.use(cors());
app.use(express.json());

const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/files', express.static(uploadsDir));

// Injeção de Dependência: O 'io' fica disponível em todos os controladores via 'req.io'
app.use((req, res, next) => {
  req.io = io;
  next();
});

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const loanRoutes = require('./routes/loanRoutes');
const userRoutes = require('./routes/userRoutes');
const collectionRoutes = require('./routes/collectionRoutes');

const friendshipRoutes = require('./routes/friendshipRoutes');
const publicLibraryRoutes = require('./routes/publicLibraryRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const blockRoutes = require('./routes/blockRoutes');
const reportRoutes = require('./routes/reportRoutes');
const moderationRoutes = require('./routes/moderationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collections', collectionRoutes);

app.use('/api/friendships', friendshipRoutes);
app.use('/api/public-library', publicLibraryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/blocks', blockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/moderation', moderationRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✔ Conexão com o banco estabelecida com sucesso.');

    await sequelize.sync();
    console.log('✔ Todos os modelos foram sincronizados.');

    // Atenção: O '.listen' agora é chamado no 'server' (HTTP + WS), não apenas no 'app' (Express)
    server.listen(PORT, () => {
      console.log(`🚀 Servidor do vioLib rodando com sucesso na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro crítico ao iniciar o servidor ou conectar ao banco:', error);
    process.exit(1);
  }
}

startServer();
