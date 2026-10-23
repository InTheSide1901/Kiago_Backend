const express = require('express');
const router = express.Router();
const favoritoController = require('../controllers/favoritoController');

router.post('/favoritosAgregar', favoritoController.agregarFavorito);
router.delete('/favoritosEliminar', favoritoController.eliminarFavorito);
router.get('/favoritos/:usuario_id/:local_id', favoritoController.consultarFavorito);
router.get('/favoritos/:usuario_id', favoritoController.consultarTodosFavoritos);

module.exports = router;