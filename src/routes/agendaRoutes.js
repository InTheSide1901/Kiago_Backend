
const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
const { verifyJWT } = require('../middlewares/authMiddleware');

// Obtener agenda del usuario autenticado
router.get('/', verifyJWT, agendaController.obtenerAgenda);

// Agendar un lugar
router.post('/', verifyJWT, agendaController.agendarLugar);

// Eliminar una visita de la agenda del usuario autenticado
router.delete('/:id', verifyJWT, agendaController.eliminarLugar);

module.exports = router;

