const { DataTypes } = require('sequelize');
// Importação direta da conexão, seguindo o padrão do seu projeto
const sequelize = require('../config/database');

/**
 * Modelo que representa uma Coleção (o "álbum" de figurinhas).
 * Guarda as definições gerais e os nomes dos eixos dinâmicos.
 */
const Collection = sequelize.define(
  'Collection',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'O título da coleção é obrigatório.' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bannerImage: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Caminho da imagem de capa/hero da coleção no servidor.'
    },
    /**
     * EIXOS DINÂMICOS (Simulação de JSON para Oracle DB)
     */
    customAxes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('customAxes');
        try {
          return rawValue ? JSON.parse(rawValue) : [];
        } catch (e) {
          return [];
        }
      },
      set(value) {
        this.setDataValue('customAxes', JSON.stringify(value || []));
      },
      validate: {
        isValidArray(value) {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          if (!Array.isArray(parsed)) {
            throw new Error('customAxes deve ser um array.');
          }
          if (parsed.length > 4) {
            throw new Error('O máximo permitido são 4 eixos de agrupamento.');
          }
        }
      }
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  },
  {
    tableName: 'Collections',
    timestamps: true
  }
);

module.exports = Collection;
