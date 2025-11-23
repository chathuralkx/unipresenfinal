// backend/routes/passwordReset.js
const express = require('express');
const router = express.Router();
const prController = require('../controllers/passwordResetController');

router.post('/request-otp', prController.requestOtp);
router.post('/verify-otp', prController.verifyOtp);
router.post('/reset-password', prController.resetPassword);

module.exports = router;
