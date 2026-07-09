'use strict';

/**
 * Migração para criar a tabela de Coleções (Collections).
 * Guarda as definições do álbum e os Eixos Dinâmicos em formato TEXT (compatível com Oracle/Postgres).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Collections', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      bannerImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      customAxes: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '[]' // Texto simulando JSON Array vazio
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'USERS', // Nome exato da tabela no banco
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Collections');
  }
};
