const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Translator = sequelize.define(
  'Translator',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Garante que nenhum autor exista sem um dono
      references: { model: 'USERS', key: 'id' }
    }
  },
  {
    tableName: 'TRANSLATORS',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Translator;
