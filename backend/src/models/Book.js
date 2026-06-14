const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define('Book', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  edition: { type: DataTypes.STRING },
  releaseYear: { type: DataTypes.INTEGER },
  publisher: { type: DataTypes.STRING },
  acquisitionDate: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT },
  coverImage: { type: DataTypes.STRING },
  UserId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, // Garante que o livro obrigatoriamente tenha um dono
    references: { model: 'USERS', key: 'id' } 
  }
}, { 
  tableName: 'BOOKS', 
  timestamps: true 
});

module.exports = Book;