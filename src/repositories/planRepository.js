const db = require('../config/database');


const obtenerTodosLosPlanes = async () => {
    const [rows] = await db.execute('SELECT * FROM planes ORDER BY id ASC');
    return rows;
};
const actualizarPlanUsuario = async (usuarioId, planId) => {
    const [result] = await db.execute(
        'UPDATE usuarios SET plan_id = ? WHERE id = ?',
        [planId, usuarioId]
    );
    return result;
};

module.exports = {
    actualizarPlanUsuario,
    obtenerTodosLosPlanes
};