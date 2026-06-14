const express = require('express');
const router = express.Router();
const accessController = require('../controllers/AccessController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken); // Protege todas as rotas abaixo

router.post('/share', accessController.shareLibrary);
router.get('/shared-with-me', accessController.getSharedWithMe);
router.get('/:ownerId/books', accessController.getSharedBooks);

module.exports = router;