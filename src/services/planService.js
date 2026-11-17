const planRepository = require('../repositories/planRepository');


const listarPlanes = async () => {
    return await planRepository.obtenerTodosLosPlanes();
};

const cambiarPlanUsuario = async (usuarioId, planId) => {
    if (!planId) {
        throw new Error('VALIDATION_ERROR: El ID del plan es requerido');
    }
    
    const result = await planRepository.actualizarPlanUsuario(usuarioId, planId);
    
    if (result.affectedRows === 0) {
        throw new Error('NOT_FOUND: Usuario no encontrado o el plan no pudo ser actualizado');
    }
    
    return { planId };
};

module.exports = {
    cambiarPlanUsuario,
    listarPlanes
};