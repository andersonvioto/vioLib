const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define(
  'Book',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    isbn: { type: DataTypes.STRING },
    title: { type: DataTypes.STRING, allowNull: false },
    edition: { type: DataTypes.STRING },
    releaseYear: { type: DataTypes.INTEGER },
    publisher: { type: DataTypes.STRING },
    publicationLocation: { type: DataTypes.STRING },
    pageCount: { type: DataTypes.INTEGER },
    language: { type: DataTypes.STRING },
    format: { type: DataTypes.STRING },
    acquisitionDate: {
      type: DataTypes.DATE,
      get() {
        const rawValue = this.getDataValue('acquisitionDate');
        if (!rawValue) return null;
        const dateObj = new Date(rawValue);
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      },
      set(value) {
        if (!value) {
          this.setDataValue('acquisitionDate', null);
          return;
        }
        const dateString =
          typeof value === 'string' ? value.split('T')[0] : value.toISOString().split('T')[0];
        this.setDataValue('acquisitionDate', new Date(`${dateString}T12:00:00.000Z`));
      }
    },
    notes: { type: DataTypes.TEXT },
    coverImage: { type: DataTypes.STRING },
    readingStatus: {
      type: DataTypes.ENUM('unread', 'reading', 'read'),
      allowNull: false,
      defaultValue: 'unread'
    },
    UserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'USERS', key: 'id' } }
  },
  { tableName: 'BOOKS', timestamps: true }
);

module.exports = Book;
