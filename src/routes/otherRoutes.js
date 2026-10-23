const express = require('express');
const router = express.Router();
const localController = require('../controllers/localController');
const authController = require('../controllers/authController');

router.get('/categorias', localController.getCategorias);
router.get('/usuarios/:id', authController.obtenerUsuarioPorId);

module.exports = router;