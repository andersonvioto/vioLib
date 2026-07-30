const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PushSubscription = sequelize.define(
  'PushSubscription',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    keys: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Objeto JSON contendo p256dh e auth keys'
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  },
  {
    tableName: 'PushSubscriptions',
    timestamps: true
  }
);

module.exports = PushSubscription;
