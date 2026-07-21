'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('LIBRARY_ACCESS', 'canViewLibrary', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('LIBRARY_ACCESS', 'canViewCollections', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * REVERTENDO AS ALTERAÇÕES (Rollback)
     */

    await queryInterface.removeColumn('LIBRARY_ACCESS', 'canViewLibrary');
    await queryInterface.removeColumn('LIBRARY_ACCESS', 'canViewCollections');
  }
};
