const { Op } = require('sequelize');
const { Author, Translator, Genre, Subgenre, Tag, Book, Friendship } = require('../models');

exports.getAllAttributes = async (req, res) => {
  try {
    const { usedOnly, ownerId } = req.query;
    let targetUserId = req.userId;

    if (ownerId && parseInt(ownerId, 10) !== req.userId) {
      const parsedOwnerId = parseInt(ownerId, 10);

      const hasAccess = await Friendship.findOne({
        where: {
          status: 'accepted',
          [Op.or]: [
            { requesterId: parsedOwnerId, receiverId: req.userId },
            { requesterId: req.userId, receiverId: parsedOwnerId }
          ]
        }
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado aos atributos desta biblioteca.' });
      }
      targetUserId = parsedOwnerId;
    }

    const isUsedOnly = usedOnly === 'true';

    const includeOptions = isUsedOnly
      ? [
          {
            model: Book,
            attributes: [],
            through: { attributes: [] },
            required: true
          }
        ]
      : [];

    const [authors, translators, tags, genres, subgenres] = await Promise.all([
      Author.findAll({
        where: { UserId: targetUserId },
        include: includeOptions,
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      }),
      Translator.findAll({
        where: { UserId: targetUserId },
        include: includeOptions,
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      }),
      Tag.findAll({
        where: { UserId: targetUserId },
        include: includeOptions,
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      }),
      Genre.findAll({
        where: { UserId: targetUserId },
        include: includeOptions,
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      }),
      Subgenre.findAll({
        include: [
          { model: Genre, where: { UserId: targetUserId }, attributes: [] },
          ...includeOptions
        ],
        attributes: ['id', 'name', 'GenreId'],
        order: [['name', 'ASC']]
      })
    ]);

    const unique = (arr) => {
      if (!arr) return [];
      const seen = new Set();
      return arr.filter((item) => {
        const identifier = item.id || item.name;
        if (seen.has(identifier)) return false;
        seen.add(identifier);
        return true;
      });
    };

    const cleanPayload = (items) => {
      return unique(items).map((item) => {
        const obj = typeof item.toJSON === 'function' ? item.toJSON() : item;
        delete obj.Books;
        return obj;
      });
    };

    const genresMap = {};
    const cleanGenres = [];

    unique(genres).forEach((g) => {
      const genreData = typeof g.toJSON === 'function' ? g.toJSON() : g;
      delete genreData.Books;
      genreData.Subgenres = [];
      genresMap[genreData.id] = genreData;
      cleanGenres.push(genreData);
    });

    unique(subgenres).forEach((s) => {
      const subData = typeof s.toJSON === 'function' ? s.toJSON() : s;
      delete subData.Books;
      delete subData.Genre;

      if (genresMap[subData.GenreId]) {
        genresMap[subData.GenreId].Subgenres.push(subData);
      }
    });

    res.json({
      authors: cleanPayload(authors),
      translators: cleanPayload(translators),
      tags: cleanPayload(tags),
      genres: cleanGenres
    });
  } catch (error) {
    console.error('🕵️ ERRO NO ATTRIBUTE CONTROLLER:', error);
    res.status(500).json({ error: 'Erro ao processar a busca de atributos do sistema.' });
  }
};
