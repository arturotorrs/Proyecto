const router = require('express').Router();
const { login, refresh, logout, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', verifyToken, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
