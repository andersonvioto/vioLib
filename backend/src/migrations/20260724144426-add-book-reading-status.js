'use strict';

/**
 * Migração para adicionar o controle de status de leitura aos livros.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('BOOKS', 'readingStatus', {
        type: Sequelize.ENUM('unread', 'reading', 'read'),
        allowNull: false,
        defaultValue: 'unread'
      });
    } catch (error) {
      console.warn('⚠️ Coluna readingStatus não adicionada (já existe ou erro):', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('BOOKS', 'readingStatus');
    } catch (error) {
      console.warn('⚠️ Erro ao tentar remover coluna readingStatus:', error.message);
    }
  }
};
