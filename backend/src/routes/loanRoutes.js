const express = require('express');
const router = express.Router();
const loanController = require('../controllers/LoanController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.post('/', loanController.createLoan);
router.put('/:id/return', loanController.returnLoan);

module.exports = router;