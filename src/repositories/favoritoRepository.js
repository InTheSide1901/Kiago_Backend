const db = require('../config/database');

async function verificarFavorito(usuario_id, local_id) {
    const [filas] = await db.query(
        'SELECT 1 FROM favoritos WHERE usuario_id = ? AND local_id = ? LIMIT 1',
        [usuario_id, local_id]
    );
    return filas.length > 0;
}

async function agregarFavorito(usuario_id, local_id) {
    await db.query(
        'INSERT INTO favoritos (usuario_id, local_id) VALUES (?, ?)',
        [usuario_id, local_id]
    );
}

async function eliminarFavorito(usuario_id, local_id) {
    const [result] = await db.query(
        'DELETE FROM favoritos WHERE usuario_id = ? AND local_id = ?',
        [usuario_id, local_id]
    );
    return result.affectedRows;
}

async function getFavoritosByUsuarioId(usuario_id) {
    const query = `
        SELECT
            l.id,  
            l.nombre,
            c.id AS categoria_id,
            img.url_imagen AS imagen_principal
        FROM favoritos f
        INNER JOIN locales l ON f.local_id = l.id
        LEFT JOIN categorias c ON l.categoria_id = c.id
        LEFT JOIN imagenes_locales img
            ON l.id = img.local_id AND img.es_principal = 1
        WHERE f.usuario_id = ?
    `;
    const [favoritos] = await db.query(query, [usuario_id]);
    return favoritos;
}

module.exports = {
    verificarFavorito,
    agregarFavorito,
    eliminarFavorito,
    getFavoritosByUsuarioId
};