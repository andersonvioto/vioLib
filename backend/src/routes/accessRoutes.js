const express = require('express');
const router = express.Router();
const accessController = require('../controllers/AccessController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// --- Gerenciamento de compartilhamento ---
router.get('/shared-with-me', accessController.getSharedWithMe);
router.get('/my-shares', accessController.getMyShares);
router.post('/share', accessController.shareLibrary);
router.put('/shares/:guestId', accessController.updateAccess);
router.delete('/shares/:guestId', accessController.revokeAccess);

// --- Consulta de conteúdos compartilhados (Modo Convidado) ---
router.get('/:ownerId/books', accessController.getSharedBooks);
router.get('/:ownerId/collections', accessController.getSharedCollections);
router.get('/:ownerId/collections/:collectionId', accessController.getSharedCollectionById);

module.exports = router;
