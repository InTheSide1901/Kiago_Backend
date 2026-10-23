const db = require('../config/database');

async function crearSolicitud(valores) {
    const sql = `
        INSERT INTO solicitudes_locales (
            usuario_id, categoria_id, ciudad_id, nombre, nombre_titular, apellido, descripcion, 
            telefono, correo_electronico, sitio_web, calle, altura, 
            latitud, longitud, url_imagen, estado, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW(), NOW())
    `;
    const [result] = await db.query(sql, valores);
    return result.insertId;
}

async function getSolicitudesPendientes() {
    const [pendientes] = await db.query(`
        SELECT sl.*, c.nombre as categoria_nombre, ciu.nombre as ciudad_nombre 
        FROM solicitudes_locales sl
        LEFT JOIN categorias c ON sl.categoria_id = c.id
        LEFT JOIN ciudades ciu ON sl.ciudad_id = ciu.id
        WHERE sl.estado = 'pendiente'
    `);
    return pendientes;
}

async function rechazarSolicitud(id, motivo) {
    await db.query(
        'UPDATE solicitudes_locales SET estado = "rechazado", motivo_rechazo = ?, updated_at = NOW() WHERE id = ?', 
        [motivo || 'No cumple con los requisitos.', id]
    );
}

async function getMisSolicitudes(usuario_id) {
    const [misSolicitudes] = await db.query(`
        SELECT * FROM solicitudes_locales 
        WHERE usuario_id = ? 
        ORDER BY created_at DESC
    `, [usuario_id]);
    return misSolicitudes;
}

module.exports = {
    crearSolicitud,
    getSolicitudesPendientes,
    rechazarSolicitud,
    getMisSolicitudes
};