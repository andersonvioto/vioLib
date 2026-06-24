const express = require('express');
const router = express.Router();
const bookController = require('../controllers/BookController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configuração do Multer para upload de imagens
const multer = require('multer');
const multerConfig = require('../config/multer');
const upload = multer(multerConfig);

// Proteção global para todas as rotas deste arquivo
router.use(authMiddleware);

/**
 * Rotas principais de Livros
 */
router.route('/')
  .get(bookController.getAllBooks)
  .post(upload.single('coverImage'), bookController.createBook);

router.route('/:id')
  .get(bookController.getBookById)
  .put(upload.single('coverImage'), bookController.updateBook)
  .delete(bookController.deleteBook);

/**
 * Rotas auxiliares para metadados de livros
 */
router.get('/authors', bookController.getAllAuthors);
router.get('/translators', bookController.getAllTranslators);

module.exports = router;