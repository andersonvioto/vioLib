const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');

const multer = require('multer');
const multerConfig = require('../config/multer');
const upload = multer(multerConfig);

router.use(authMiddleware);

router.get('/profile', UserController.getProfile);

// Atualizado para suportar o envio de ficheiros de imagem (avatar) via form-data
router.put('/profile', upload.single('avatar'), UserController.updateProfile);

router.delete('/profile', UserController.deleteAccount);

module.exports = router;
