const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define('Book', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  isbn: { type: DataTypes.STRING }, // Adicionado para a busca/exibição
  title: { type: DataTypes.STRING, allowNull: false },
  edition: { type: DataTypes.STRING },
  releaseYear: { type: DataTypes.INTEGER },
  publisher: { type: DataTypes.STRING },
  publicationLocation: { type: DataTypes.STRING }, // NOVO: Cidade/País da publicação
  acquisitionDate: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT },
  coverImage: { type: DataTypes.STRING },
  UserId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: 'USERS', key: 'id' } 
  }
}, { 
  tableName: 'BOOKS', 
  timestamps: true 
});

module.exports = Book;