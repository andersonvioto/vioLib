const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subgenre = sequelize.define(
  'Subgenre',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    GenreId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'GENRES', key: 'id' }
    }
  },
  {
    tableName: 'SUBGENRES',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Subgenre;
