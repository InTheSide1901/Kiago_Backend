const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT } = require('../middlewares/authMiddleware');
const { verificarAuthDuenio } = require('../middlewares/authMiddleware');

router.put('/perfil/datos', verificarAuthDuenio, authController.actualizarDatos);
router.put('/perfil/password', verificarAuthDuenio, authController.cambiarPassword);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyJWT, authController.me);

module.exports = router;