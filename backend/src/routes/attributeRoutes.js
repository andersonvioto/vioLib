const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/AttributeController');
const authMiddleware = require('../middlewares/authMiddleware');
const AuthorController = require('../controllers/AuthorController');
const TranslatorController = require('../controllers/TranslatorController');
const GenreController = require('../controllers/GenreController');
const SubgenreController = require('../controllers/SubgenreController');

router.use(authMiddleware);
router.get('/', attributeController.getAllAttributes);
router.get('/authors', authMiddleware, AuthorController.getAll);
router.get('/translators', authMiddleware, TranslatorController.getAll);
router.get('/genres', authMiddleware, GenreController.getAll);

router.post('/authors', authMiddleware, AuthorController.create);
router.post('/translators', authMiddleware, TranslatorController.create);
router.post('/genres', authMiddleware, GenreController.create);
router.post('/subgenres', authMiddleware, SubgenreController.create);

router.put('/authors/:id', authMiddleware, AuthorController.update);
router.put('/translators/:id', authMiddleware, TranslatorController.update);
router.put('/genres/:id', authMiddleware, GenreController.update);
router.put('/subgenres/:id', authMiddleware, SubgenreController.update);

router.get('/subgenres', authMiddleware, SubgenreController.getAll);
router.delete('/subgenres/:id', authMiddleware, SubgenreController.delete);
router.delete('/authors/:id', authMiddleware, AuthorController.delete);
router.delete('/translators/:id', authMiddleware, TranslatorController.delete);
router.delete('/genres/:id', authMiddleware, GenreController.delete);

module.exports = router;