const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/AttributeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/', attributeController.getAllAttributes);

module.exports = router;