const sequelize = require('../config/database');
const User = require('./User');
const Book = require('./Book');
const Author = require('./Author');
const Translator = require('./Translator');
const Genre = require('./Genre');
const Subgenre = require('./Subgenre');
const Tag = require('./Tag');
const Loan = require('./Loan');
const Collection = require('./Collection');
const CollectionItem = require('./CollectionItem');
const GlobalBook = require('./GlobalBook');
const Friendship = require('./Friendship');
const Comment = require('./Comment');
const Notification = require('./Notification');
const PushSubscription = require('./PushSubscription');
const Block = require('./Block');
const Report = require('./Report');

User.hasMany(Book, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Book.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Author, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Author.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Translator, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Translator.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Genre, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Genre.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Tag, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Tag.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Collection, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Collection.belongsTo(User, { foreignKey: 'UserId' });

Genre.hasMany(Subgenre, { foreignKey: 'GenreId', onDelete: 'CASCADE' });
Subgenre.belongsTo(Genre, { foreignKey: 'GenreId' });
Book.hasMany(Loan, { foreignKey: 'BookId', onDelete: 'CASCADE' });
Loan.belongsTo(Book, { foreignKey: 'BookId' });

Collection.hasMany(CollectionItem, { foreignKey: 'CollectionId', onDelete: 'CASCADE' });
CollectionItem.belongsTo(Collection, { foreignKey: 'CollectionId' });
Book.hasMany(CollectionItem, { foreignKey: 'BookId', onDelete: 'SET NULL' });
CollectionItem.belongsTo(Book, { foreignKey: 'BookId' });

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

// ==========================================
// NOVOS RELACIONAMENTOS SOCIAIS
// ==========================================

// Amizades
User.hasMany(Friendship, { foreignKey: 'requesterId', as: 'SentRequests' });
Friendship.belongsTo(User, { foreignKey: 'requesterId', as: 'Requester' });

User.hasMany(Friendship, { foreignKey: 'receiverId', as: 'ReceivedRequests' });
Friendship.belongsTo(User, { foreignKey: 'receiverId', as: 'Receiver' });

// Comentários
User.hasMany(Comment, { foreignKey: 'UserId' });
Comment.belongsTo(User, { foreignKey: 'UserId' });

Book.hasMany(Comment, { foreignKey: 'BookId' });
Comment.belongsTo(Book, { foreignKey: 'BookId' });

// Notificações
User.hasMany(Notification, { foreignKey: 'UserId', as: 'MyNotifications' });
Notification.belongsTo(User, { foreignKey: 'UserId', as: 'Owner' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'TriggeredNotifications' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'Sender' });

// Push Subscriptions
User.hasMany(PushSubscription, { foreignKey: 'UserId', onDelete: 'CASCADE' });
PushSubscription.belongsTo(User, { foreignKey: 'UserId' });

// ==========================================
// MODERAÇÃO E CONFIANÇA (UGC)
// ==========================================

// Bloqueios
User.hasMany(Block, { foreignKey: 'blockerId', as: 'BlocksInitiated' });
Block.belongsTo(User, { foreignKey: 'blockerId', as: 'Blocker' });

User.hasMany(Block, { foreignKey: 'blockedId', as: 'BlocksReceived' });
Block.belongsTo(User, { foreignKey: 'blockedId', as: 'Blocked' });

// Denúncias (Reports)
User.hasMany(Report, { foreignKey: 'reporterId', as: 'ReportsSubmitted' });
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'Reporter' });

User.hasMany(Report, { foreignKey: 'reportedUserId', as: 'ReportsReceived' });
Report.belongsTo(User, { foreignKey: 'reportedUserId', as: 'ReportedUser' });

Comment.hasMany(Report, { foreignKey: 'reportedCommentId' });
Report.belongsTo(Comment, { foreignKey: 'reportedCommentId' });

module.exports = {
  sequelize,
  User,
  Book,
  Author,
  Translator,
  Genre,
  Subgenre,
  Tag,
  Loan,
  Collection,
  CollectionItem,
  GlobalBook,
  Friendship,
  Comment,
  Notification,
  PushSubscription,
  Block,
  Report
};
