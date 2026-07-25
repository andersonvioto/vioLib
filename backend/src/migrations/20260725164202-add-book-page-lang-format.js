'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('BOOKS', 'pageCount', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('BOOKS', 'language', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('BOOKS', 'format', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('BOOKS', 'pageCount');
    await queryInterface.removeColumn('BOOKS', 'language');
    await queryInterface.removeColumn('BOOKS', 'format');
  }
};
