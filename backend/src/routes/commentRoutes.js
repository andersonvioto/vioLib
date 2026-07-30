const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/book/:bookId', CommentController.getComments);
router.post('/book/:bookId', CommentController.addComment);
router.delete('/:commentId', CommentController.deleteComment);

module.exports = router;
