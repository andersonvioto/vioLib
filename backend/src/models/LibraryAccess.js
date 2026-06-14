const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LibraryAccess = sequelize.define('LibraryAccess', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'USERS', key: 'id' }
  },
  guestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'USERS', key: 'id' }
  }
}, {
  tableName: 'LIBRARY_ACCESS',
  timestamps: true
  // O bloco 'indexes' que estava aqui foi removido
});

module.exports = LibraryAccess;