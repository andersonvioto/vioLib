const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const attributeController = require('../controllers/AttributeController');
const AuthorController = require('../controllers/AuthorController');
const TranslatorController = require('../controllers/TranslatorController');
const GenreController = require('../controllers/GenreController');
const SubgenreController = require('../controllers/SubgenreController');

router.use(authMiddleware);

router.get('/', attributeController.getAllAttributes);

router.route('/authors').get(AuthorController.list).post(AuthorController.store);

router.route('/authors/:id').put(AuthorController.update).delete(AuthorController.destroy);

router.route('/translators').get(TranslatorController.list).post(TranslatorController.store);

router
  .route('/translators/:id')
  .put(TranslatorController.update)
  .delete(TranslatorController.destroy);

router.route('/genres').get(GenreController.list).post(GenreController.store);

router.route('/genres/:id').put(GenreController.update).delete(GenreController.destroy);

router.route('/subgenres').get(SubgenreController.list).post(SubgenreController.store);

router.route('/subgenres/:id').put(SubgenreController.update).delete(SubgenreController.destroy);

module.exports = router;
