const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyJWT, authController.me);
router.patch('/me', verifyJWT, authController.actualizarMiPerfil);

module.exports = router;
