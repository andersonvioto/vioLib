const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Block = sequelize.define(
  'Block',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    blockerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    blockedId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  },
  {
    tableName: 'Blocks',
    timestamps: true
  }
);

module.exports = Block;
