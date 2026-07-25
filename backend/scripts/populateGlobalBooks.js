require('dotenv').config();
// CORREÇÃO CRÍTICA: Apontando para o diretório "src/models"
const { sequelize, Book, Author, GlobalBook } = require('../src/models');

/**
 * Função utilitária idêntica à usada nos Controllers para garantir
 * que a Impressão Digital (Fingerprint) bate certo.
 */
const normalize = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

async function populateCatalog() {
  try {
    // 1. Inicia a conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco estabelecida com sucesso.\n');
    console.log('⏳ A iniciar a leitura da base de dados dos utilizadores...');

    // 2. Busca todos os livros e os respetivos autores (N:M)
    const books = await Book.findAll({
      include: [{ model: Author }]
    });

    console.log(`📚 Encontrados ${books.length} livros pessoais. A processar...\n`);

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // 3. Processamento individual
    for (const book of books) {
      // Ignora livros sem título ou sem autores (não servem para o catálogo global)
      if (!book.title || !book.Authors || book.Authors.length === 0) {
        skippedCount++;
        continue;
      }

      // Extrai apenas os nomes dos autores para um array simples
      const authorNames = book.Authors.map((a) => a.name);

      // Gera a Impressão Digital única
      const fingerprint = normalize(`${book.title}-${authorNames.join(',')}`);

      // Tenta inserir no Catálogo Global de forma segura
      const [globalBook, created] = await GlobalBook.findOrCreate({
        where: { fingerprint },
        defaults: {
          title: book.title,
          authors: JSON.stringify(authorNames),
          isbn: book.isbn || null,
          publisher: book.publisher || null,
          coverImage: book.coverImage || null,
          pageCount: book.pageCount || null,
          language: book.language || null,
          format: book.format || null
        }
      });

      if (created) {
        addedCount++;
      } else {
        // PROATIVIDADE: Se o livro já existe no catálogo global, mas não tem capa,
        // e este utilizador fez o upload de uma capa, nós atualizamos o catálogo global!
        if (!globalBook.coverImage && book.coverImage) {
          globalBook.coverImage = book.coverImage;
          await globalBook.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      }
    }

    // 4. Relatório Final
    console.log(`=========================================`);
    console.log(`🏆 MIGRAÇÃO CONCLUÍDA COM SUCESSO!`);
    console.log(`=========================================`);
    console.log(`➕ Adicionados ao Catálogo Global : ${addedCount}`);
    console.log(`🔄 Catálogos Atualizados (Capas)  : ${updatedCount}`);
    console.log(`⏭️ Ignorados (Incompletos/Duplos) : ${skippedCount}`);
    console.log(`=========================================\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO DURANTE A MIGRAÇÃO:', error);
    process.exit(1);
  }
}

// Executa a função
populateCatalog();
