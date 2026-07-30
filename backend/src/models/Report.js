const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define(
  'Report',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    // Opcional: Só preenchido se a denúncia for contra um perfil
    reportedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'USERS',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    // Opcional: Só preenchido se a denúncia for contra um comentário específico
    reportedCommentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Comments',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
      allowNull: false,
      defaultValue: 'pending'
    }
  },
  {
    tableName: 'Reports',
    timestamps: true
  }
);

module.exports = Report;
