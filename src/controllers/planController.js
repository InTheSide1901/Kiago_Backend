const planService = require('../services/planService');

const obtenerPlanes = async (req, res) => {
    try {
        const planes = await planService.listarPlanes();
        res.status(200).json(planes);
    } catch (error) {
        console.error('Error en obtenerPlanes:', error);
        res.status(500).json({ error: 'Error al obtener los planes disponibles' });
    }
};

const cambiarPlan = async (req, res) => {
    try {
        const { planId } = req.body;
        const usuarioId = req.user.id; // Ahora lee req.user.id de tu middleware

        const resultado = await planService.cambiarPlanUsuario(usuarioId, planId);
        
        res.status(200).json({ 
            mensaje: 'Plan actualizado con éxito', 
            plan_id: resultado.planId 
        });

    } catch (error) {
        if (error.message.includes('VALIDATION_ERROR')) {
            return res.status(400).json({ error: error.message.replace('VALIDATION_ERROR: ', '') });
        }
        if (error.message.includes('NOT_FOUND')) {
            return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
        }
        
        console.error('Error en cambiarPlan:', error);
        res.status(500).json({ error: 'Error interno del servidor al cambiar el plan' });
    }
};

module.exports = {
    cambiarPlan,
    obtenerPlanes
};