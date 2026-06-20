const express = require('express');
const router = express.Router();
const bookController = require('../controllers/BookController');
const verifyToken = require('../middlewares/authMiddleware');

// Importações do Multer
const multer = require('multer');
const multerConfig = require('../config/multer');
const upload = multer(multerConfig);

router.use(verifyToken);

// Adicionamos o 'upload.single' para capturar o arquivo chamado 'coverImage'
router.post('/', upload.single('coverImage'), bookController.createBook);
router.put('/:id', upload.single('coverImage'), bookController.updateBook);

router.get('/', bookController.getAllBooks);
router.get('/authors', bookController.getAllAuthors);
router.get('/translators', bookController.getAllTranslators);
router.get('/:id', bookController.getBookById);

router.delete('/:id', bookController.deleteBook);

module.exports = router;