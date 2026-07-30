const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: true, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    language: { type: DataTypes.STRING(5), defaultValue: 'pt-BR', allowNull: false },

    // Preferências Globais de Privacidade
    shareCollections: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
    shareReadingStatus: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
    shareNotes: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },

    // Controle de Moderação e Acesso (UGC)
    role: {
      type: DataTypes.ENUM('user', 'admin', 'banned'),
      defaultValue: 'user',
      allowNull: false
    },

    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verificationToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: 'USERS',
    timestamps: true
  }
);

module.exports = User;
