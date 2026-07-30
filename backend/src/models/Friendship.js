const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modelo de Amizade (Relacionamento Bidirecional)
 */
const Friendship = sequelize.define(
  'Friendship',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    }
  },
  {
    tableName: 'Friendships',
    timestamps: true
  }
);

module.exports = Friendship;
