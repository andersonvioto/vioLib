const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define(
  'Book',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    isbn: {
      type: DataTypes.STRING
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    edition: {
      type: DataTypes.STRING
    },
    releaseYear: {
      type: DataTypes.INTEGER
    },
    publisher: {
      type: DataTypes.STRING
    },
    publicationLocation: {
      type: DataTypes.STRING
    },
    acquisitionDate: {
      type: DataTypes.DATE,

      /**
       * Getter: Formata a saída para o Frontend independentemente do offset de hora no banco.
       */
      get() {
        const rawValue = this.getDataValue('acquisitionDate');
        if (!rawValue) return null;

        const dateObj = new Date(rawValue);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
      },

      /**
       * Setter: Buffer de Meio-dia convertido em Objeto Date.
       * Evita o ORA-01861 (erro de formato) e previne o shift de fuso horário.
       */
      set(value) {
        if (!value) {
          this.setDataValue('acquisitionDate', null);
          return;
        }

        const dateString =
          typeof value === 'string' ? value.split('T')[0] : value.toISOString().split('T')[0];

        // Criamos um objeto Date nativo do JS. O Sequelize o reconhece e formata o bind corretamente para o Oracle.
        const bufferDate = new Date(`${dateString}T12:00:00.000Z`);

        this.setDataValue('acquisitionDate', bufferDate);
      }
    },
    notes: {
      type: DataTypes.TEXT
    },
    coverImage: {
      type: DataTypes.STRING
    },
    readingStatus: {
      type: DataTypes.ENUM('unread', 'reading', 'read'),
      allowNull: false,
      defaultValue: 'unread'
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'USERS', key: 'id' }
    }
  },
  {
    tableName: 'BOOKS',
    timestamps: true
  }
);

module.exports = Book;
