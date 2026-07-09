const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: process.env.DB_DIALECT,
  logging: false,
  dialectOptions: {
    connectString: process.env.DB_CONNECTION_STRING,
    // Configurações exclusivas para mTLS / TLS com Wallet
    walletLocation: process.env.DB_WALLET_LOCATION,
    walletPassword: process.env.DB_WALLET_PASSWORD
  }
});

module.exports = sequelize;
