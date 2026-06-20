const express = require('express');
const router = express.Router();
const accessController = require('../controllers/AccessController');
const authMiddleware = require('../middlewares/authMiddleware'); // Mantemos apenas um para ficar limpo

// Protege TODAS as rotas deste arquivo automaticamente
router.use(authMiddleware); 

router.get('/shared-with-me', accessController.getSharedWithMe);
router.get('/:ownerId/books', accessController.getSharedBooks);
router.get('/my-shares', accessController.getMyShares);
router.post('/share', accessController.shareLibrary);
router.delete('/revoke/:guestId', accessController.revokeAccess);

module.exports = router;