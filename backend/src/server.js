const express = require('express');
require('dotenv').config();
const { sequelize } = require('./models');
const cors = require('cors'); 

const app = express();
app.use(cors());
app.use(express.json()); 

const path = require('path');
const fs = require('fs');

// Cria a pasta de uploads caso seja a primeira vez rodando
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Libera o acesso público às imagens salvas
app.use('/files', express.static(uploadsDir));

// 1. Importação das rotas (cada uma declarada apenas UMA vez)
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const loanRoutes = require('./routes/loanRoutes');
const accessRoutes = require('./routes/accessRoutes'); 
const userRoutes = require('./routes/userRoutes');

// 2. Conexão das rotas no Express
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/access', accessRoutes); 
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;

// 3. Inicialização do Servidor e do Banco de Dados
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✔ Conexão com o banco estabelecida com sucesso.');

    // Usando apenas sync() limpo para não apagar ou duplicar índices
    await sequelize.sync(); 
    console.log('✔ Todos os modelos foram sincronizados.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor do vioLib rodando com sucesso na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro crítico ao iniciar o servidor ou conectar ao banco:', error);
    process.exit(1);
  }
}

startServer();