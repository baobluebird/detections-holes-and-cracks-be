const express = require('express');
const router = express.Router();
const codeController = require('../controllers/code.controllers');
const {  authUserMiddleware  } = require('../middleware/authMiddleware');

router.post('/create-code', codeController.createCode);
router.post('/resend-code', codeController.resendCode);
router.post('/verify-code/:id', codeController.verifyCode);
router.post('/reset-password/:id', codeController.resetPassword);
router.post('/create-token-email', codeController.createTokenEmail);
module.exports = router;  