const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false }, // Campo adicionado
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  language: { type: DataTypes.STRING(5), defaultValue: 'pt-BR', allowNull: false },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verificationToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
}, { 
  tableName: 'USERS', 
  timestamps: true,
});

module.exports = User;