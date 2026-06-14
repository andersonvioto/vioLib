const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  borrowerName: { type: DataTypes.STRING, allowNull: false },
  loanDate: { type: DataTypes.DATEONLY, allowNull: false },
  returnDate: { type: DataTypes.DATEONLY, allowNull: true }, // Nulo significa que o livro ainda está emprestado
  BookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'BOOKS', key: 'id' }
  }
}, {
  tableName: 'LOANS',
  timestamps: true
});

module.exports = Loan;