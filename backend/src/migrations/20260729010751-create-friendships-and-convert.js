'use strict';

/**
 * Migração complexa:
 * 1. Cria a tabela Friendships.
 * 2. Migra os dados da antiga LibraryAccess para a Friendships (como amizades 'accepted').
 * 3. Apaga a antiga tabela LibraryAccess.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Criar a nova tabela Friendships
    await queryInterface.createTable('Friendships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      requesterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'USERS',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      receiverId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'USERS',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
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

    // Adiciona índices para buscas mais rápidas (Performance)
    await queryInterface.addIndex('Friendships', ['requesterId']);
    await queryInterface.addIndex('Friendships', ['receiverId']);

    // 2. Extrair dados da LibraryAccess antiga
    try {
      const [accesses] = await queryInterface.sequelize.query('SELECT * FROM "LIBRARY_ACCESS"');

      if (accesses && accesses.length > 0) {
        const friendshipsToInsert = accesses.map((access) => ({
          requesterId: access.ownerId,
          receiverId: access.guestId,
          status: 'accepted', // Conforme acordado com os testadores
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        // Inserir os dados na nova tabela
        await queryInterface.bulkInsert('Friendships', friendshipsToInsert);
        console.log(`✅ Foram migradas ${friendshipsToInsert.length} conexões antigas.`);
      }
    } catch (e) {
      console.log(
        '⚠️ Aviso: Não foi possível migrar os dados antigos (talvez a tabela LibraryAccess esteja vazia ou não exista).',
        e.message
      );
    }

    // 3. Eliminar a tabela antiga
    try {
      await queryInterface.dropTable('LIBRARY_ACCESS');
      console.log('✅ Tabela LIBRARY_ACCESS removida com sucesso.');
    } catch (e) {
      console.log('⚠️ Aviso: Erro ao tentar apagar LIBRARY_ACCESS.', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Para rollback, apenas apagamos as amizades (não podemos recriar os dados antigos facilmente)
    await queryInterface.dropTable('Friendships');
  }
};
