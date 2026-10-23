const express = require('express');
const router = express.Router();
const localController = require('../controllers/localController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/cercanos', localController.getCercanos);
router.get('/buscar', localController.buscarLocales);
router.get('/categoria/:categoriaId', localController.getLocalesPorCategoria);
router.get('/:id', localController.getLocalById);

// Rutas generales de datos/locales
router.get('/', localController.getAllDatos);
router.post('/', upload.single('imagen'), localController.crearDato);
router.put('/:id', localController.actualizarDato);
router.delete('/:id', localController.eliminarDato);

module.exports = router;