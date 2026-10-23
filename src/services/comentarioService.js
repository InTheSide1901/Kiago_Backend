const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME } = require('../config/s3');
const comentarioRepository = require('../repositories/comentarioRepository');
const { v4: uuidv4 } = require('uuid');

async function crearComentario(usuarioId, body, file) {
    const { localId, calificacion, contenido } = body;

    if (!localId || !calificacion) {
        throw new Error('FALTAN_DATOS');
    }

    const existente = await comentarioRepository.findResenaByLocalAndUser(localId, usuarioId);
    if (existente) {
        throw new Error('COMMENT_EXISTS');
    }

    let url_imagen = null;
    if (file) {
        const extension = file.originalname.split('.').pop() || 'jpg';
        const s3Key = `comentarios/user_${usuarioId}/local_${localId}/${Date.now()}_${uuidv4()}.${extension}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));
        url_imagen = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
    }

    const insertId = await comentarioRepository.createResena(localId, usuarioId, calificacion, contenido, url_imagen);
    return { resenaId: insertId, url_imagen };
}

async function actualizarComentario(comentarioId, usuarioId, body, file) {
    const { calificacion, contenido, conservarImagen } = body;

    const resena = await comentarioRepository.findResenaByIdAndUser(comentarioId, usuarioId);
    if (!resena) {
        throw new Error('NO_PERMISO');
    }

    let url_imagen = resena.url_imagen;

    if (file) {
        const extension = file.originalname.split('.').pop() || 'jpg';
        const s3Key = `comentarios/user_${usuarioId}/local_${resena.local_id}/${Date.now()}_${uuidv4()}.${extension}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));
        url_imagen = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
    } else if (conservarImagen === 'false') {
        url_imagen = null;
    }

    await comentarioRepository.updateResena(calificacion, contenido, url_imagen, comentarioId, usuarioId);
}

module.exports = {
    crearComentario,
    actualizarComentario
};