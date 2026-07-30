require('dotenv').config();
const { sequelize, Book, Author, GlobalBook } = require('../src/models');

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

async function populateCatalog() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco estabelecida com sucesso.\n');
    console.log('⏳ A iniciar a leitura da base de dados dos usuários...');

    const books = await Book.findAll({
      include: [{ model: Author }]
    });

    console.log(`📚 Encontrados ${books.length} livros pessoais. A processar...\n`);

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const book of books) {
      if (!book.title || !book.Authors || book.Authors.length === 0) {
        skippedCount++;
        continue;
      }

      const authorNames = book.Authors.map((a) => a.name);

      const rawFingerprint = normalizeText(`${book.title}-${authorNames.join(',')}`);
      // SOLUÇÃO AQUI: Trava de segurança cortando o texto em 1990 caracteres
      const fingerprint = rawFingerprint.substring(0, 1990);

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
        if (!globalBook.coverImage && book.coverImage) {
          globalBook.coverImage = book.coverImage;
          await globalBook.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      }
    }

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

populateCatalog();
