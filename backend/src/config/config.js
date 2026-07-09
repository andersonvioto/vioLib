require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT || 'oracle',
    dialectOptions: {
      connectString: process.env.DB_CONNECTION_STRING,
      walletLocation: process.env.DB_WALLET_LOCATION,
      walletPassword: process.env.DB_WALLET_PASSWORD
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT || 'oracle',
    dialectOptions: {
      connectString: process.env.DB_CONNECTION_STRING,
      walletLocation: process.env.DB_WALLET_LOCATION,
      walletPassword: process.env.DB_WALLET_PASSWORD
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT || 'oracle',
    logging: false,
    dialectOptions: {
      connectString: process.env.DB_CONNECTION_STRING,
      walletLocation: process.env.DB_WALLET_LOCATION,
      walletPassword: process.env.DB_WALLET_PASSWORD
    }
  }
};
