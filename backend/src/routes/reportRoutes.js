const express = require('express');
const router = express.Router();
const reportController = require('../controllers/ReportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Rota para submeter uma nova denúncia (Perfil ou Comentário)
router.post('/', reportController.createReport);

module.exports = router;
