const sequelize = require('../config/database');
const User = require('./User');
const Book = require('./Book');
const Author = require('./Author');
const Translator = require('./Translator');
const Genre = require('./Genre');
const Subgenre = require('./Subgenre');
const Tag = require('./Tag');
const Loan = require('./Loan');
const LibraryAccess = require('./LibraryAccess');

// Relacionamentos 1:N (Listas autônomas e exclusivas do Usuário)
User.hasMany(Book, { foreignKey: 'UserId', onDelete: 'CASCADE' }); Book.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Author, { foreignKey: 'UserId', onDelete: 'CASCADE' }); Author.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Translator, { foreignKey: 'UserId', onDelete: 'CASCADE' }); Translator.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Genre, { foreignKey: 'UserId', onDelete: 'CASCADE' }); Genre.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Tag, { foreignKey: 'UserId', onDelete: 'CASCADE' }); Tag.belongsTo(User, { foreignKey: 'UserId' });

// Relacionamento hierárquico Gênero -> Subgênero
Genre.hasMany(Subgenre, { foreignKey: 'GenreId', onDelete: 'CASCADE' });
Subgenre.belongsTo(Genre, { foreignKey: 'GenreId' });

// Relacionamento 1:N (Livro -> Empréstimos)
Book.hasMany(Loan, { foreignKey: 'BookId', onDelete: 'CASCADE' });
Loan.belongsTo(Book, { foreignKey: 'BookId' });

// Relacionamentos N:M (Livros com suas propriedades)
Book.belongsToMany(Author, { through: 'Book_Authors', timestamps: false });
Author.belongsToMany(Book, { through: 'Book_Authors', timestamps: false });

Book.belongsToMany(Translator, { through: 'Book_Translators', timestamps: false });
Translator.belongsToMany(Book, { through: 'Book_Translators', timestamps: false });

Book.belongsToMany(Genre, { through: 'Book_Genres', timestamps: false });
Genre.belongsToMany(Book, { through: 'Book_Genres', timestamps: false });

Book.belongsToMany(Subgenre, { through: 'Book_Subgenres', timestamps: false });
Subgenre.belongsToMany(Book, { through: 'Book_Subgenres', timestamps: false });

Book.belongsToMany(Tag, { through: 'Book_Tags', timestamps: false });
Tag.belongsToMany(Book, { through: 'Book_Tags', timestamps: false });

// Relacionamentos para Compartilhamento de Biblioteca (Uso de apelidos 'as' devido a chaves múltiplas para a mesma tabela)
/*User.belongsToMany(User, { as: 'SharedLibraries', through: LibraryAccess, foreignKey: 'ownerId', otherKey: 'guestId' });
User.belongsToMany(User, { as: 'AccessibleLibraries', through: LibraryAccess, foreignKey: 'guestId', otherKey: 'ownerId' });**/

User.hasMany(LibraryAccess, { foreignKey: 'ownerId', as: 'SharedLibraries' });
LibraryAccess.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });

User.hasMany(LibraryAccess, { foreignKey: 'guestId', as: 'AccessibleLibraries' });
LibraryAccess.belongsTo(User, { foreignKey: 'guestId', as: 'Guest' });

module.exports = {
  sequelize, User, Book, Author, Translator, Genre, Subgenre, Tag, Loan, LibraryAccess
};