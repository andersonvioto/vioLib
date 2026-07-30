'use strict';

/**
 * Migração para criar as tabelas de Interação (Comentários e Notificações).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tabela de Comentários (Para os Livros)
    await queryInterface.createTable('Comments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'USERS', key: 'id' },
        onDelete: 'CASCADE'
      },
      BookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'BOOKS', key: 'id' },
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

    // Tabela de Notificações
    await queryInterface.createTable('Notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('friend_request', 'friend_accepted', 'new_comment'),
        allowNull: false
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      referenceId: {
        type: Sequelize.INTEGER, // ID do livro comentado ou do user requerente (para link no frontend)
        allowNull: true
      },
      UserId: {
        // O dono da notificação (quem vai ler)
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'USERS', key: 'id' },
        onDelete: 'CASCADE'
      },
      senderId: {
        // Quem causou a ação
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'USERS', key: 'id' },
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
    await queryInterface.dropTable('Notifications');
    await queryInterface.dropTable('Comments');
  }
};
