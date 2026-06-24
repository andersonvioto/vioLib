const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  borrowerName: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  loanDate: { 
    // Corrigido de DATEONLY para DATE para não neutralizar o Time Buffer
    type: DataTypes.DATE,
    allowNull: false,

    /**
     * Getter: Formata a saída para o Frontend independentemente do offset de hora no banco.
     */
    get() {
      const rawValue = this.getDataValue('loanDate');
      if (!rawValue) return null;

      const dateObj = new Date(rawValue);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    },
    
    /**
     * Setter: Buffer de Meio-dia convertido em Objeto Date.
     * Evita o ORA-01861 e previne a supressão de data pelo DATEONLY.
     */
    set(value) {
      if (!value) {
        this.setDataValue('loanDate', null);
        return;
      }
      
      const dateString = typeof value === 'string' 
        ? value.split('T')[0] 
        : value.toISOString().split('T')[0];
      
      const bufferDate = new Date(`${dateString}T12:00:00.000Z`);
      this.setDataValue('loanDate', bufferDate);
    }
  },
  returnDate: { 
    // Corrigido de DATEONLY para DATE
    type: DataTypes.DATE, 
    allowNull: true,
    
    get() {
      const rawValue = this.getDataValue('returnDate');
      if (!rawValue) return null;

      const dateObj = new Date(rawValue);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    },
    
    set(value) {
      if (!value) {
        this.setDataValue('returnDate', null);
        return;
      }
      
      const dateString = typeof value === 'string' 
        ? value.split('T')[0] 
        : value.toISOString().split('T')[0];
      
      const bufferDate = new Date(`${dateString}T12:00:00.000Z`);
      this.setDataValue('returnDate', bufferDate);
    }
  },
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