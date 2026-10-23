const express = require('express');
const router = express.Router();
const comentarioController = require('../controllers/comentarioController');
const { verifyJWT } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', verifyJWT, upload.single('imagen'), comentarioController.crear);
router.put('/:id', verifyJWT, upload.single('imagen'), comentarioController.actualizar);
router.delete('/:id', verifyJWT, comentarioController.eliminar);
router.get('/local/:localId', comentarioController.obtenerPorLocal);

module.exports = router;