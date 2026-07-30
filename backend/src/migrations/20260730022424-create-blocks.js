'use strict';

/**
 * Migração para criar a tabela de Bloqueios.
 * Impede que dois utilizadores interajam ou vejam o conteúdo um do outro.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Blocks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      blockerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'USERS',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      blockedId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'USERS',
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

    // Índice único para garantir que um utilizador não bloqueia o mesmo alvo duas vezes
    await queryInterface.addIndex('Blocks', ['blockerId', 'blockedId'], {
      unique: true,
      name: 'unique_block_pair'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Blocks');
  }
};
