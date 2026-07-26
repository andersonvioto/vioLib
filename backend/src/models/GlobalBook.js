const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GlobalBook = sequelize.define(
  'GlobalBook',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    isbn: { type: DataTypes.STRING },
    title: { type: DataTypes.STRING, allowNull: false },
    authors: { type: DataTypes.TEXT }, // JSON stringified
    publisher: { type: DataTypes.STRING },
    coverImage: { type: DataTypes.STRING },
    pageCount: { type: DataTypes.INTEGER },
    language: { type: DataTypes.STRING },
    format: { type: DataTypes.STRING },
    fingerprint: { type: DataTypes.STRING(2000), allowNull: false, unique: true }
  },
  {
    tableName: 'GLOBAL_BOOKS',
    timestamps: true
  }
);

module.exports = GlobalBook;
