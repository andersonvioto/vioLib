'use strict';

/**
 * Migração para adicionar as colunas do perfil social na tabela USERS.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Adiciona o username.
      // Permitimos null temporariamente porque os utilizadores antigos ainda não têm um.
      // O frontend vai forçar o preenchimento no próximo login.
      await queryInterface.addColumn('USERS', 'username', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });

      await queryInterface.addColumn('USERS', 'avatarUrl', {
        type: Sequelize.STRING,
        allowNull: true
      });

      // Preferências de Privacidade (Por padrão: TUDO PÚBLICO para amigos)
      await queryInterface.addColumn('USERS', 'shareCollections', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });

      await queryInterface.addColumn('USERS', 'shareReadingStatus', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });

      await queryInterface.addColumn('USERS', 'shareNotes', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    } catch (error) {
      console.error('❌ Erro na migração de colunas sociais:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('USERS', 'username');
      await queryInterface.removeColumn('USERS', 'avatarUrl');
      await queryInterface.removeColumn('USERS', 'shareCollections');
      await queryInterface.removeColumn('USERS', 'shareReadingStatus');
      await queryInterface.removeColumn('USERS', 'shareNotes');
    } catch (error) {
      console.error('❌ Erro no rollback das colunas sociais:', error.message);
      throw error;
    }
  }
};
