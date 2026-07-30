const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/ModerationController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Protege todas as rotas com autenticação e validação de administrador
router.use(authMiddleware);
router.use(adminMiddleware);

// Listar todas as denúncias
router.get('/reports', moderationController.getReports);

// Resolver uma denúncia (Body requer { action: 'dismiss' | 'delete_comment' | 'ban_user' })
router.put('/reports/:reportId/resolve', moderationController.resolveReport);

module.exports = router;
