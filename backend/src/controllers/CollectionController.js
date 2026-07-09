const { Collection, CollectionItem, Book } = require('../models');

/**
 * ============================================================================
 * GESTÃO DE COLEÇÕES (OS ÁLBUNS)
 * ============================================================================
 */

exports.createCollection = async (req, res) => {
  try {
    const { title, description } = req.body;
    // O array de eixos dinâmicos vem como string JSON do FormData
    const customAxes = req.body.customAxes ? JSON.parse(req.body.customAxes) : [];

    // Tratamento de upload de imagem para o Hero Banner
    const bannerImage = req.file ? req.file.path : null;

    const collection = await Collection.create({
      title,
      description: description || null,
      bannerImage,
      customAxes,
      UserId: req.userId
    });

    res.status(201).json({ message: 'Coleção criada com sucesso!', collection });
  } catch (error) {
    console.error('❌ ERRO AO CRIAR COLEÇÃO:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar a coleção.' });
  }
};

exports.getCollections = async (req, res) => {
  try {
    // Trazemos todas as coleções do utilizador e os seus itens para calcularmos o progresso geral
    const collections = await Collection.findAll({
      where: { UserId: req.userId },
      include: [
        {
          model: CollectionItem,
          attributes: ['id', 'status'] // Só precisamos do status para fazer a matemática
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Pós-processamento rápido para injetar os dados de Gamificação (Anel de Progresso)
    const enrichedCollections = collections.map((col) => {
      const plainCol = col.toJSON();
      const totalItems = plainCol.CollectionItems.length;
      const ownedItems = plainCol.CollectionItems.filter((i) => i.status !== 'missing').length;
      const progress = totalItems === 0 ? 0 : Math.round((ownedItems / totalItems) * 100);

      delete plainCol.CollectionItems; // Removemos o array pesado, enviamos apenas o resumo

      return {
        ...plainCol,
        stats: { totalItems, ownedItems, progress }
      };
    });

    res.json(enrichedCollections);
  } catch (error) {
    console.error('❌ ERRO AO BUSCAR COLEÇÕES:', error);
    res.status(500).json({ error: 'Erro ao buscar as coleções.' });
  }
};

exports.getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      where: { id, UserId: req.userId },
      include: [
        {
          model: CollectionItem,
          include: [{ model: Book, attributes: ['id', 'title', 'coverImage'] }] // Traz o livro vinculado se existir
        }
      ]
    });

    if (!collection) return res.status(404).json({ error: 'Coleção não encontrada.' });

    const plainCol = collection.toJSON();
    const items = plainCol.CollectionItems;

    // --- CÁLCULO DE GAMIFICAÇÃO E BARRAS DE XP (MÁXIMA PERFORMANCE EM O(N)) ---
    let totalItems = items.length;
    let ownedItems = 0;

    // Objeto que vai guardar o progresso de cada Eixo Dinâmico
    // Exemplo: { "Edição": { "1a": { total: 10, owned: 5 } } }
    const axisStats = {};
    plainCol.customAxes.forEach((axis) => {
      axisStats[axis] = {};
    });

    items.forEach((item) => {
      const isOwned = item.status !== 'missing';
      if (isOwned) ownedItems++;

      // Alimenta os stats das Barras de XP
      plainCol.customAxes.forEach((axis) => {
        // Pega o valor do eixo para este item (ex: "1a")
        const axisValue = item.axisValues[axis] || 'Não categorizado';

        if (!axisStats[axis][axisValue]) {
          axisStats[axis][axisValue] = { total: 0, owned: 0 };
        }

        axisStats[axis][axisValue].total++;
        if (isOwned) axisStats[axis][axisValue].owned++;
      });
    });

    res.json({
      ...plainCol,
      stats: {
        totalItems,
        ownedItems,
        progress: totalItems === 0 ? 0 : Math.round((ownedItems / totalItems) * 100),
        axisStats // Dados prontos para renderizar as Barras Horizontais no Frontend!
      }
    });
  } catch (error) {
    console.error('❌ ERRO AO BUSCAR DETALHES DA COLEÇÃO:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes da coleção.' });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const deleted = await Collection.destroy({ where: { id: req.params.id, UserId: req.userId } });
    if (!deleted) return res.status(404).json({ error: 'Coleção não encontrada.' });
    res.json({ message: 'Coleção excluída com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir coleção.' });
  }
};

/**
 * ============================================================================
 * GESTÃO DE ITENS (AS FIGURINHAS)
 * ============================================================================
 */

exports.addItem = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { title, status, axisValues, BookId } = req.body;

    // Verifica se a coleção pertence ao utilizador
    const collection = await Collection.findOne({
      where: { id: collectionId, UserId: req.userId }
    });
    if (!collection) return res.status(404).json({ error: 'Coleção inválida.' });

    const item = await CollectionItem.create({
      title,
      status: status || 'missing',
      axisValues: axisValues || {}, // Ex: { "Edição": "1", "Categoria": "Aventura" }
      CollectionId: collection.id,
      BookId: BookId || null
    });

    res.status(201).json({ message: 'Item adicionado à coleção!', item });
  } catch (error) {
    console.error('❌ ERRO AO ADICIONAR ITEM:', error);
    res.status(500).json({ error: 'Erro ao adicionar item.' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { title, status, axisValues, BookId } = req.body;

    // Segurança: Garantir que o item pertence a uma coleção do utilizador logado
    const item = await CollectionItem.findOne({
      where: { id: itemId },
      include: [{ model: Collection, where: { UserId: req.userId } }]
    });

    if (!item) return res.status(404).json({ error: 'Item não encontrado ou acesso negado.' });

    await item.update({
      title: title || item.title,
      status: status || item.status,
      axisValues: axisValues || item.axisValues,
      BookId: BookId !== undefined ? BookId : item.BookId
    });

    res.json({ message: 'Item atualizado com sucesso!', item });
  } catch (error) {
    console.error('❌ ERRO AO ATUALIZAR ITEM:', error);
    res.status(500).json({ error: 'Erro ao atualizar item.' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await CollectionItem.findOne({
      where: { id: itemId },
      include: [{ model: Collection, where: { UserId: req.userId } }]
    });

    if (!item) return res.status(404).json({ error: 'Item não encontrado.' });

    await item.destroy();
    res.json({ message: 'Item removido da coleção.' });
  } catch (error) {
    console.error('🕵️ ERRO NO COLLECTION CONTROLLER (DELETE ITEM):', error);
    res.status(500).json({ error: 'Erro ao remover item.' });
  }
};
