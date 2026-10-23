const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME } = require('../config/s3');
const localRepository = require('../repositories/localRepository');

async function buscarLocalesCercanos(lat, lng, radioMetros) {
    const radioKm = radioMetros / 1000;
    const rows = await localRepository.getLocalesCercanos(lat, lng, radioKm);

    return rows.map(local => ({
        ...local,
        distancia_metros: Math.round(local.distancia_km * 1000),
        promedio_calificacion: Number(local.promedio_calificacion)
    }));
}

async function crearLocalDirecto(body, file) {
    const { 
        nombre, categoria_principal, descripcion, telefono, correo_electronico, 
        sitio_web, ciudad_localidad, provincia, direccion, codigo_postal, 
        altura, latitud, longitud 
    } = body;

    let urlImagenS3 = '';

    if (file) {
        const extension = file.originalname.split('.').pop();
        const fileKey = `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype
        }));

        urlImagenS3 = `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${fileKey}`;
    }

    const values = [
        nombre || 'Sin Nombre',
        categoria_principal || 'General',
        descripcion || '',
        telefono || '',
        correo_electronico || '',
        sitio_web || '',
        ciudad_localidad || 'Sin especificar',
        provincia || 'Sin especificar',
        direccion || 'Sin especificar',
        codigo_postal || '',
        altura || 0,
        latitud || 0.0,
        longitud || 0.0,
        urlImagenS3,
        '[]'
    ];

    const insertId = await localRepository.crearLocalDatosDirectos(values);
    return { id: insertId, nombre, imagen_principal: urlImagenS3 };
}

module.exports = {
    buscarLocalesCercanos,
    crearLocalDirecto
};