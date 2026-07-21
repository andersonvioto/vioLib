const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LibraryAccess = sequelize.define(
  'LibraryAccess',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USERS', // <-- CORREÇÃO: Maiúsculas para o Oracle Database
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    guestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'USERS', // <-- CORREÇÃO: Maiúsculas para o Oracle Database
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    canViewLibrary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Permissão para ver o acervo principal de livros'
    },
    canViewCollections: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Permissão para ver os álbuns e o progresso das coleções'
    }
  },
  {
    tableName: 'LIBRARY_ACCESS', // <-- CORREÇÃO: Maiúsculas para o Oracle Database
    timestamps: true
  }
);

module.exports = LibraryAccess;
