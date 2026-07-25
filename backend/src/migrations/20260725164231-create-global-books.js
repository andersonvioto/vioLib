'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('GLOBAL_BOOKS', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      isbn: { type: Sequelize.STRING, allowNull: true },
      title: { type: Sequelize.STRING, allowNull: false },
      authors: { type: Sequelize.TEXT, allowNull: true }, // Armazenado como JSON stringificado
      publisher: { type: Sequelize.STRING, allowNull: true },
      coverImage: { type: Sequelize.STRING, allowNull: true },
      pageCount: { type: Sequelize.INTEGER, allowNull: true },
      language: { type: Sequelize.STRING, allowNull: true },
      format: { type: Sequelize.STRING, allowNull: true },
      fingerprint: { type: Sequelize.STRING, allowNull: false, unique: true }, // Título + Autor normalizado
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('GLOBAL_BOOKS');
  }
};
