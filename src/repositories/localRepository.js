const db = require('../config/database');

async function getAllLocales() {
    const [results] = await db.query('SELECT * FROM locales');
    return results;
}

async function getLocalById(id) {
    const query = `
        SELECT 
            l.*,
            d.calle AS direccion,
            d.altura,
            d.latitud,
            d.longitud,
            c.nombre AS ciudad_localidad,
            p.nombre AS provincia,
            img.url_imagen AS imagen_principal
        FROM locales l
        LEFT JOIN direcciones d ON l.direccion_id = d.id
        LEFT JOIN ciudades c ON d.ciudad_id = c.id
        LEFT JOIN provincias p ON c.provincia_id = p.id
        LEFT JOIN imagenes_locales img ON l.id = img.local_id AND img.es_principal = 1
        WHERE l.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0];
}

async function getLocalesCercanos(lat, lng, radioKm) {
    const query = `
        SELECT 
            l.id,
            l.nombre,
            l.descripcion,
            l.telefono,
            l.correo_electronico,
            l.sitio_web,
            l.categoria_id,
            c.nombre AS categoria,
            c.icono AS categoria_icono,
            d.calle,
            d.altura,
            d.latitud,
            d.longitud,
            img.url_imagen AS imagen_principal,
            COALESCE(AVG(r.puntuacion), 0) AS promedio_calificacion,
            (
                6371 * acos(
                    cos(radians(?)) * cos(radians(d.latitud)) *
                    cos(radians(d.longitud) - radians(?)) +
                    sin(radians(?)) * sin(radians(d.latitud))
                )
            ) AS distancia_km
        FROM locales l
        INNER JOIN direcciones d ON l.direccion_id = d.id
        LEFT JOIN categorias c ON l.categoria_id = c.id
        LEFT JOIN imagenes_locales img ON l.id = img.local_id AND img.es_principal = 1
        LEFT JOIN resenas r ON l.id = r.local_id
        GROUP BY 
            l.id, l.nombre, l.descripcion, l.telefono, l.correo_electronico, 
            l.sitio_web, l.categoria_id, c.nombre, c.icono, d.calle, d.altura, 
            d.latitud, d.longitud, img.url_imagen
        HAVING distancia_km <= ?
        ORDER BY distancia_km ASC
    `;
    const [rows] = await db.query(query, [lat, lng, lat, radioKm]);
    return rows;
}

async function buscarLocalesPorNombre(q) {
    const query = `
        SELECT id, nombre, categoria_id 
        FROM locales 
        WHERE nombre LIKE ? 
        ORDER BY nombre ASC 
        LIMIT 6
    `;
    const [results] = await db.query(query, [`%${q}%`]);
    return results;
}

async function getCategorias() {
    const [categorias] = await db.query('SELECT id, nombre, icono FROM categorias ORDER BY id ASC');
    return categorias;
}

async function getLocalesPorCategoria(categoriaId) {
    const query = `
        SELECT 
            l.*,
            d.calle AS direccion,
            d.altura,
            d.latitud,
            d.longitud,
            c.nombre AS ciudad_localidad,
            p.nombre AS provincia,
            img.url_imagen AS imagen_principal
        FROM locales l
        LEFT JOIN direcciones d ON l.direccion_id = d.id
        LEFT JOIN ciudades c ON d.ciudad_id = c.id
        LEFT JOIN provincias p ON c.provincia_id = p.id
        LEFT JOIN imagenes_locales img ON l.id = img.local_id AND img.es_principal = 1
        WHERE l.categoria_id = ?
    `;
    const [locales] = await db.query(query, [categoriaId]);
    return locales;
}

async function crearLocalDatosDirectos(values) {
    const query = `
        INSERT INTO locales (
            nombre, categoria_principal, descripcion, telefono, correo_electronico, 
            sitio_web, ciudad_localidad, provincia, direccion, codigo_postal, 
            altura, latitud, longitud, imagen_principal, imagenes_adicionales
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, values);
    return result.insertId;
}

async function actualizarLocalNombre(id, nombre) {
    await db.query('UPDATE locales SET nombre = ? WHERE id = ?', [nombre, id]);
}

async function eliminarLocal(id) {
    await db.query('DELETE FROM locales WHERE id = ?', [id]);
}
async function getLocalesPorUsuarioId(usuarioId) {
    const sql = `
        SELECT 
            l.id AS local_id,
            l.nombre AS nombre_local,
            l.descripcion,
            l.telefono,
            l.correo_electronico,
            l.sitio_web,
            l.created_at,
            c.nombre AS categoria,
            d.calle,
            d.altura,
            d.latitud,
            d.longitud,
            ciu.nombre AS ciudad,
            img.url_imagen AS foto_principal
        FROM locales l
        LEFT JOIN categorias c ON l.categoria_id = c.id
        LEFT JOIN direcciones d ON l.direccion_id = d.id
        LEFT JOIN ciudades ciu ON d.ciudad_id = ciu.id
        LEFT JOIN imagenes_locales img ON l.id = img.local_id AND img.es_principal = 1
        WHERE l.usuario_id = ?
        ORDER BY l.created_at DESC;
    `;

    const [rows] = await db.query(sql, [usuarioId]);
    return rows;
}
async function getMetricasDueño(usuarioId) {
    // 1. Contar aprobados (están en la tabla locales)
    const [aprobadosRes] = await db.query('SELECT COUNT(*) as count FROM locales WHERE usuario_id = ?', [usuarioId]);
    
    // 2. Contar pendientes y rechazados (están en solicitudes_locales)
    const [pendientesRes] = await db.query('SELECT COUNT(*) as count FROM solicitudes_locales WHERE usuario_id = ? AND estado = "pendiente"', [usuarioId]);
    const [rechazadosRes] = await db.query('SELECT COUNT(*) as count FROM solicitudes_locales WHERE usuario_id = ? AND estado = "rechazado"', [usuarioId]);

    const aprobados = aprobadosRes[0].count;
    const pendientes = pendientesRes[0].count;
    const rechazados = rechazadosRes[0].count;
    const total = aprobados + pendientes + rechazados;

    return { total, aprobados, pendientes, rechazados };
}

module.exports = {
    getAllLocales,
    getLocalById,
    getLocalesCercanos,
    buscarLocalesPorNombre,
    getCategorias,
    getLocalesPorCategoria,
    crearLocalDatosDirectos,
    actualizarLocalNombre,
    eliminarLocal,
    getLocalesPorUsuarioId,
    getMetricasDueño
};