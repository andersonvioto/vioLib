const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tag = sequelize.define('Tag', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  UserId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, // Garante que nenhum autor exista sem um dono
    references: { model: 'USERS', key: 'id' } 
  },
}, { 
  tableName: 'TAGS', 
  timestamps: true 
});

module.exports = Tag;