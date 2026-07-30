'use strict';

/**
 * Migração para criar a tabela de Denúncias (Reports).
 * Obrigatório para cumprir as políticas UGC (User Generated Content) da Google Play.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Reports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reporterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'USERS',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      reportedUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'USERS',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      reportedCommentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Comments',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending' // pending, resolved, dismissed
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
    await queryInterface.dropTable('Reports');
  }
};
