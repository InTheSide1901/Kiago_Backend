const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { verifyJWT } = require('../middlewares/authMiddleware');

router.get('/', verifyJWT, planController.obtenerPlanes);
// PUT /api/planes/cambiar
router.put('/cambiar', verifyJWT, planController.cambiarPlan);

module.exports = router;