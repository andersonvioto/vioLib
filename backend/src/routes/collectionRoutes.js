const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/CollectionController');
const authMiddleware = require('../middlewares/authMiddleware');

const multer = require('multer');
const multerConfig = require('../config/multer');
const upload = multer(multerConfig);

router.use(authMiddleware);

/**
 * Rotas principais de Coleções (Álbuns)
 */
router
  .route('/')
  .get(CollectionController.getCollections)
  .post(upload.single('bannerImage'), CollectionController.createCollection);

router
  .route('/:id')
  .get(CollectionController.getCollectionById)
  .put(upload.single('bannerImage'), CollectionController.updateCollection)
  .delete(CollectionController.deleteCollection);

/**
 * Rotas auxiliares para Itens das Coleções (Figurinhas)
 */
router.route('/:collectionId/items').post(CollectionController.addItem);

router
  .route('/items/:itemId')
  .put(CollectionController.updateItem)
  .delete(CollectionController.deleteItem);

module.exports = router;
