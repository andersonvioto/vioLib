'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * ADICIONANDO CAMPOS NA TABELA 'USERS'
     */
    await queryInterface.addColumn('USERS', 'isVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addColumn('USERS', 'verificationToken', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('USERS', 'resetPasswordToken', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('USERS', 'resetPasswordExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });

    /**
     * ADICIONANDO CAMPO 'deletedAt' PARA O PARANOID
     * (Assumindo que as outras tabelas também estejam em caixa alta no Oracle)
     */
    await queryInterface.addColumn('AUTHORS', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('TRANSLATORS', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('GENRES', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('SUBGENRES', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * REVERTENDO AS ALTERAÇÕES (Rollback)
     */
    await queryInterface.removeColumn('USERS', 'isVerified');
    await queryInterface.removeColumn('USERS', 'verificationToken');
    await queryInterface.removeColumn('USERS', 'resetPasswordToken');
    await queryInterface.removeColumn('USERS', 'resetPasswordExpires');

    await queryInterface.removeColumn('AUTHORS', 'deletedAt');
    await queryInterface.removeColumn('TRANSLATORS', 'deletedAt');
    await queryInterface.removeColumn('GENRES', 'deletedAt');
    await queryInterface.removeColumn('SUBGENRES', 'deletedAt');
  }
};