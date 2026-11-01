const { PutObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME } = require('../config/s3');
const solicitudRepository = require('../repositories/solicitudRepository');
const db = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

function generarPassword(longitud) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < longitud; i++) {
        password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return password;
}

async function crearSolicitud(usuario_id, body, file) {
    const {
        nombre, nombre_titular, apellido, categoria_id, ciudad_id, 
        descripcion, telefono, correo_electronico, sitio_web, 
        calle, altura, latitud, longitud
    } = body;

    if (!nombre || !nombre_titular || !apellido || !categoria_id || !ciudad_id || !calle) {
        throw new Error('FALTAN_CAMPOS');
    }

    let url_imagen = null;
    if (file) {
        const extension = file.originalname.split('.').pop() || 'jpg';
        const s3Key = `solicitudes_locales/user_${usuario_id}/${Date.now()}_${uuidv4()}.${extension}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));
        url_imagen = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
    }

    const valores = [
        usuario_id, categoria_id, ciudad_id, nombre, nombre_titular, apellido, 
        descripcion, telefono, correo_electronico, sitio_web || null, 
        calle, altura, latitud, longitud, url_imagen
    ];

    const insertId = await solicitudRepository.crearSolicitud(valores);
    return { solicitudId: insertId, url_imagen };
}

async function aprobarSolicitud(id) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Buscar la solicitud pendiente
        const [solicitudes] = await conn.query('SELECT * FROM solicitudes_locales WHERE id = ? AND estado = "pendiente"', [id]);
        if (solicitudes.length === 0) throw new Error('Solicitud no encontrada');
        const solicitud = solicitudes[0];

        let usuarioIdDestino = null;
        let credencialesGeneradas = null;

        // 2. Averiguar el rol del usuario que envió el formulario
        const [creador] = await conn.query('SELECT rol_id FROM usuarios WHERE id = ?', [solicitud.usuario_id]);
        const rolCreador = creador[0] ? creador[0].rol_id : null;

        if (rolCreador === 2) {
            // ES UN DUEÑO: Se le asigna a su propia cuenta sin crear usuario ni contraseña
            usuarioIdDestino = solicitud.usuario_id;
        } else {
            // ES UN TURISTA: Creamos SIEMPRE una cuenta nueva de Dueño
            const passwordGenerada = generarPassword(10);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passwordGenerada, salt);

            const [userResult] = await conn.query(`
                INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono, created_at) 
                VALUES (2, ?, ?, ?, ?, ?, NOW())
            `, [
                solicitud.nombre_titular, 
                solicitud.apellido, 
                solicitud.correo_electronico, 
                hashedPassword, 
                solicitud.telefono
            ]);

            usuarioIdDestino = userResult.insertId;
            credencialesGeneradas = {
                email: solicitud.correo_electronico,
                password_temporal: passwordGenerada
            };
        }

        // 3. Crear la dirección
        const [dirResult] = await conn.query(`
            INSERT INTO direcciones (ciudad_id, calle, altura, latitud, longitud) 
            VALUES (?, ?, ?, ?, ?)
        `, [solicitud.ciudad_id, solicitud.calle, solicitud.altura, solicitud.latitud, solicitud.longitud]);
        const nuevaDireccionId = dirResult.insertId;

        // 4. Crear el local asignándole el usuarioIdDestino (ya sea existente o nuevo)
        const [localResult] = await conn.query(`
            INSERT INTO locales (usuario_id, categoria_id, direccion_id, nombre, descripcion, telefono, correo_electronico, sitio_web, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            usuarioIdDestino, 
            solicitud.categoria_id, 
            nuevaDireccionId, 
            solicitud.nombre, 
            solicitud.descripcion, 
            solicitud.telefono, 
            solicitud.correo_electronico, 
            solicitud.sitio_web
        ]);
        const nuevoLocalId = localResult.insertId;

        // 5. Mover/Copiar la imagen en AWS S3
        if (solicitud.url_imagen) {
            const oldKey = solicitud.url_imagen.split('.amazonaws.com/')[1];
            const extension = oldKey.split('.').pop();
            const newKey = `Locales/user_${usuarioIdDestino}/local_${nuevoLocalId}_principal.${extension}`;

            await s3Client.send(new CopyObjectCommand({
                Bucket: BUCKET_NAME,
                CopySource: `${BUCKET_NAME}/${oldKey}`,
                Key: newKey
            }));

            const nuevaUrlImagen = `https://${BUCKET_NAME}.s3.amazonaws.com/${newKey}`;

            await conn.query(`
                INSERT INTO imagenes_locales (local_id, url_imagen, es_principal) 
                VALUES (?, ?, 1)
            `, [nuevoLocalId, nuevaUrlImagen]);
        }

        // 6. Actualizar estado de la solicitud
        await conn.query(`
            UPDATE solicitudes_locales 
            SET estado = "aprobado", updated_at = NOW(), password_temporal = ? 
            WHERE id = ?
        `, [credencialesGeneradas ? credencialesGeneradas.password_temporal : null, id]);

        await conn.commit();

        // 7. Retornar las credenciales (o null si el usuario ya existía)
        return credencialesGeneradas;

    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = {
    crearSolicitud,
    aprobarSolicitud
};