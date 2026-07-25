'use strict';

/**
 * Migração para aumentar o tamanho da coluna 'fingerprint'
 * para acomodar identificadores únicos mais longos (excedendo 255 caracteres).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Alteramos para VARCHAR2(2000) para garantir margem de segurança no Oracle
      await queryInterface.changeColumn('GLOBAL_BOOKS', 'fingerprint', {
        type: Sequelize.STRING(2000),
        allowNull: false
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar tamanho da coluna fingerprint:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revertemos para o tamanho original caso necessário
      await queryInterface.changeColumn('GLOBAL_BOOKS', 'fingerprint', {
        type: Sequelize.STRING(255),
        allowNull: false
      });
    } catch (error) {
      console.error('❌ Erro ao reverter tamanho da coluna fingerprint:', error.message);
      throw error;
    }
  }
};
