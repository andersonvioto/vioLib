const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Author = sequelize.define('Author', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  UserId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, // Garante que nenhum autor exista sem um dono
    references: { model: 'USERS', key: 'id' } 
  },
}, { 
  tableName: 'AUTHORS', 
  timestamps: true,
  paranoid: true
});

module.exports = Author;