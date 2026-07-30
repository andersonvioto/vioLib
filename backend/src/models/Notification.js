const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modelo do Sistema de Alertas Sociais
 */
const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('friend_request', 'friend_accepted', 'new_comment'),
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment:
        'Guarda o ID de referência para navegar. Se for um comentário, guarda o BookId. Se for convite, guarda o senderId.'
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'O dono da notificação (quem a vai ler nas suas mensagens)'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'O utilizador que disparou a ação que gerou esta notificação'
    }
  },
  {
    tableName: 'Notifications',
    timestamps: true
  }
);

module.exports = Notification;
