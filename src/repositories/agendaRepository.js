
const db = require('../config/database');

// Obtener todos los lugares agendados por un usuario
const obtenerAgendaPorUsuario = async (usuarioId) => {

    const sql = `
        SELECT
            a.id AS agenda_id,
            DATE_FORMAT(a.fecha_visita, '%Y-%m-%d') AS fecha_visita,
            l.id AS local_id,
            l.nombre AS nombre_local,

            (
                SELECT ROUND(AVG(r.puntuacion), 1)
                FROM resenas r
                WHERE r.local_id = l.id
            ) AS reputacion,

            (
                SELECT i.url_imagen
                FROM imagenes_locales i
                WHERE i.local_id = l.id
                ORDER BY i.es_principal DESC, i.id ASC
                LIMIT 1
            ) AS imagen

        FROM agenda a

        INNER JOIN locales l
            ON a.local_id = l.id

        WHERE a.usuario_id = ?

        ORDER BY a.fecha_visita ASC
    `;

    const [resultado] = await db.query(sql, [usuarioId]);

    return resultado;
};


// Verificar si existe el lugar
const existeLocal = async (localId) => {

    const sql = `
        SELECT id
        FROM locales
        WHERE id = ?
        LIMIT 1
    `;

    const [resultado] = await db.query(sql, [localId]);

    return resultado.length > 0;
};


// Insertar un nuevo evento en agenda
const crearEvento = async (usuarioId, localId, fechaVisita) => {

    const sql = `
        INSERT INTO agenda
        (usuario_id, local_id, fecha_visita)
        VALUES (?, ?, ?)
    `;

    const [resultado] = await db.query(sql, [
        usuarioId,
        localId,
        fechaVisita
    ]);

    return resultado.insertId;
};


// Eliminar solo el evento que pertenece al usuario indicado
const eliminarEvento = async (usuarioId, agendaId) => {
    const [resultado] = await db.query(
        'DELETE FROM agenda WHERE id = ? AND usuario_id = ?',
        [agendaId, usuarioId]
    );

    return resultado.affectedRows > 0;
};


module.exports = {
    obtenerAgendaPorUsuario,
    existeLocal,
    crearEvento,
    eliminarEvento
};
