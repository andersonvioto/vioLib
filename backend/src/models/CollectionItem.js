const { DataTypes } = require('sequelize');
// Importação direta da conexão, seguindo o padrão do seu projeto
const sequelize = require('../config/database');

/**
 * Modelo que representa um Item dentro de uma Coleção (a "figurinha").
 * Guarda o status de posse e os valores específicos dos eixos dinâmicos.
 */
const CollectionItem = sequelize.define('CollectionItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome do item é obrigatório.' },
    },
  },
  status: {
    type: DataTypes.ENUM('missing', 'physical', 'digital', 'both'),
    allowNull: false,
    defaultValue: 'missing',
  },
  /**
   * VALORES DOS EIXOS (Simulação de JSON para Oracle DB)
   */
  axisValues: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
    get() {
      const rawValue = this.getDataValue('axisValues');
      try {
        return rawValue ? JSON.parse(rawValue) : {};
      } catch (e) {
        return {};
      }
    },
    set(value) {
      this.setDataValue('axisValues', JSON.stringify(value || {}));
    }
  },
  CollectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Collections',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  BookId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Books',
      key: 'id',
    },
    onDelete: 'SET NULL', 
  },
}, {
  tableName: 'CollectionItems',
  timestamps: true,
  indexes: [
    {
      fields: ['CollectionId'],
    },
  ],
});

module.exports = CollectionItem;