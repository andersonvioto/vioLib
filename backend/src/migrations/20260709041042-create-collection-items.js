'use strict';

/**
 * Migração para criar a tabela de Itens das Coleções (CollectionItems).
 * Guarda o estado da posse e os valores dos eixos do item.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CollectionItems', {
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
      status: {
        type: Sequelize.ENUM('missing', 'physical', 'digital', 'both'),
        allowNull: false,
        defaultValue: 'missing'
      },
      axisValues: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '{}' // Texto simulando JSON Object vazio
      },
      CollectionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Collections',
          key: 'id'
        }
      },
      BookId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'BOOKS',
          key: 'id'
        },
        onDelete: 'SET NULL' // Se o livro na biblioteca for apagado, o item na coleção não é apagado (apenas desvinculado)
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

    // Criar um índice para otimizar a busca de itens por coleção (essencial para performance futura)
    await queryInterface.addIndex('CollectionItems', ['CollectionId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CollectionItems');
  }
};
