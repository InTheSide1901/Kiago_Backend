const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const { verifyJWT } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/solicitudes', verifyJWT, upload.single('imagen'), solicitudController.crear);
router.get('/solicitudes/pendientes', solicitudController.obtenerPendientes);
router.put('/solicitudes/:id/rechazar', verifyJWT, solicitudController.rechazar);
router.get('/mis-solicitudes', verifyJWT, solicitudController.obtenerMisSolicitudes);
router.post('/solicitudes/:id/aprobar', verifyJWT, solicitudController.aprobar);

module.exports = router;