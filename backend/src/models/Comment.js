const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modelo de Comentário para Obras e Coleções.
 */
const Comment = sequelize.define(
  'Comment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    BookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'BOOKS',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  },
  {
    tableName: 'Comments',
    timestamps: true
  }
);

module.exports = Comment;
