const express = require('express');
const { register, login, resetPassword, forgetPassword } = require('../controllers/adminController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/fogotpassword', forgetPassword);
router.post('/resetpassword/:token', resetPassword);

module.exports = router;