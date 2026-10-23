const db = require('../config/database');

async function findResenaByLocalAndUser(localId, usuarioId) {
    const [existente] = await db.query(
        'SELECT id FROM resenas WHERE local_id = ? AND usuario_id = ?', 
        [localId, usuarioId]
    );
    return existente[0];
}

async function createResena(localId, usuarioId, calificacion, contenido, urlImagen) {
    const sql = `
        INSERT INTO resenas (local_id, usuario_id, puntuacion, comentario, url_imagen, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await db.query(sql, [localId, usuarioId, calificacion, contenido || null, urlImagen]);
    return result.insertId;
}

async function findResenaByIdAndUser(comentarioId, usuarioId) {
    const [rows] = await db.query('SELECT * FROM resenas WHERE id = ? AND usuario_id = ?', [comentarioId, usuarioId]);
    return rows[0];
}

async function updateResena(calificacion, contenido, urlImagen, comentarioId, usuarioId) {
    const updateSql = `
        UPDATE resenas 
        SET puntuacion = ?, comentario = ?, url_imagen = ? 
        WHERE id = ? AND usuario_id = ?
    `;
    await db.query(updateSql, [calificacion, contenido || null, urlImagen, comentarioId, usuarioId]);
}

async function deleteResena(comentarioId, usuarioId) {
    const [result] = await db.query('DELETE FROM resenas WHERE id = ? AND usuario_id = ?', [comentarioId, usuarioId]);
    return result.affectedRows;
}

async function getResenasByLocalId(localId) {
    const query = `
        SELECT 
            r.id,
            r.usuario_id,
            r.puntuacion,
            r.comentario,
            r.url_imagen,
            r.created_at,
            u.nombre AS usuario_nombre,
            u.apellido AS usuario_apellido,
            u.foto_perfil AS usuario_foto
        FROM resenas r
        INNER JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.local_id = ?
        ORDER BY r.created_at DESC
    `;
    const [comentarios] = await db.query(query, [localId]);
    return comentarios;
}

module.exports = {
    findResenaByLocalAndUser,
    createResena,
    findResenaByIdAndUser,
    updateResena,
    deleteResena,
    getResenasByLocalId
};