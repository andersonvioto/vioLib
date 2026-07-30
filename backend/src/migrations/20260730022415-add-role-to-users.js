'use strict';

/**
 * Migração para adicionar a coluna de papel (role) aos utilizadores.
 * Permite distinguir administradores, utilizadores comuns e banidos.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('USERS', 'role', {
        type: Sequelize.STRING(20), // Usamos STRING no banco para evitar conflitos de ENUM no Oracle
        allowNull: false,
        defaultValue: 'user'
      });
    } catch (error) {
      console.warn('⚠️ Coluna role não adicionada (já existe ou erro):', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('USERS', 'role');
    } catch (error) {
      console.warn('⚠️ Erro ao tentar remover a coluna role:', error.message);
    }
  }
};
