const express = require('express');
const router = express.Router();
const localController = require('../controllers/localController');
const multer = require('multer');
const { verifyJWT } = require('../middlewares/authMiddleware');
const upload = multer({ storage: multer.memoryStorage() });

//usuario-dueño para que filtre todos sus locales disponibles
router.get('/mis-locales', verifyJWT, localController.obtenerMisLocales);
router.get('/cercanos', localController.getCercanos);
router.get('/metricas', verifyJWT, localController.obtenerMetricasDashboard);
router.get('/buscar', localController.buscarLocales);
router.get('/categoria/:categoriaId', localController.getLocalesPorCategoria);
router.get('/:id', localController.getLocalById);

// Rutas generales de datos/locales
router.get('/', localController.getAllDatos);
router.post('/', upload.single('imagen'), localController.crearDato);
router.put('/:id', localController.actualizarDato);
router.delete('/:id', localController.eliminarDato);


module.exports = router;