const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const authRepository = require('../repositories/authRepository');
const { JWT_SECRET, s3Client, BUCKET_NAME } = require('../config/s3');

const MAX_FOTO_PERFIL_BYTES = 5 * 1024 * 1024;
const FOTO_PERFIL_URL_EXPIRACION_SEGUNDOS = 60 * 60;

async function agregarUrlFirmadaFoto(usuario) {
    if (!usuario || !usuario.foto_perfil) return usuario;

    let key = usuario.foto_perfil;
    if (/^https?:\/\//i.test(key)) {
        try {
            key = decodeURIComponent(new URL(key).pathname.replace(/^\//, ''));
        } catch {
            return usuario;
        }
    }

    const fotoFirmada = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
        { expiresIn: FOTO_PERFIL_URL_EXPIRACION_SEGUNDOS }
    );
    return { ...usuario, foto_perfil: fotoFirmada };
}

function crearErrorPerfil(mensaje) {
    const error = new Error(mensaje);
    error.code = 'PERFIL_INVALIDO';
    return error;
}

function decodificarFotoPerfil(dataUrl) {
    const coincidencia = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
    if (!coincidencia) {
        throw crearErrorPerfil('La foto debe ser JPG, PNG o WEBP válida.');
    }

    const extensionOriginal = coincidencia[1].toLowerCase();
    const contenidoBase64 = coincidencia[2];
    const buffer = Buffer.from(contenidoBase64, 'base64');
    const base64Canonico = buffer.toString('base64').replace(/=+$/, '');

    if (!buffer.length || base64Canonico !== contenidoBase64.replace(/=+$/, '')) {
        throw crearErrorPerfil('El contenido de la foto no es válido.');
    }
    if (buffer.length > MAX_FOTO_PERFIL_BYTES) {
        throw crearErrorPerfil('La foto no puede superar los 5 MB.');
    }

    const extension = extensionOriginal === 'jpeg' ? 'jpg' : extensionOriginal;
    const contentType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
    return { buffer, extension, contentType };
}

async function registrarUsuario(data) {
    const { nombre, apellido, email, password, telefono, rol_id } = data;
    
    const usuarioExistente = await authRepository.findUserByEmail(email);
    if (usuarioExistente) {
        throw new Error('CORREO_REGISTRADO');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const idRol = rol_id || 3; // Rol por defecto: 3 (Turista)

    const insertId = await authRepository.createUser(idRol, nombre, apellido, email, passwordHash, telefono);

    const nuevoUsuario = {
        id: insertId,
        rol_id: idRol,
        nombre,
        apellido,
        email,
        telefono: telefono || null
    };

    const token = jwt.sign(
        { id: nuevoUsuario.id, email: nuevoUsuario.email, rol_id: nuevoUsuario.rol_id, nombre: nuevoUsuario.nombre },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    return { token, usuario: nuevoUsuario };
}

async function loginUsuario(email, password) {
    const usuario = await authRepository.findUserByEmail(email);
    if (!usuario) {
        throw new Error('CREDENCIALES_INVALIDAS');
    }

    const isMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!isMatch) {
        throw new Error('CREDENCIALES_INVALIDAS');
    }

    const userData = {
        id: usuario.id,
        rol_id: usuario.rol_id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        foto_perfil: usuario.foto_perfil,
        created_at: usuario.created_at
    };

    const token = jwt.sign(
        { id: userData.id, email: userData.email, rol_id: userData.rol_id, nombre: userData.nombre },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    return { token, usuario: await agregarUrlFirmadaFoto(userData) };
}

async function obtenerPerfil(userId) {
    const usuario = await authRepository.findUserById(userId);
    if (!usuario) {
        throw new Error('USUARIO_NO_ENCONTRADO');
    }
    return agregarUrlFirmadaFoto(usuario);
}

async function actualizarPerfil(userId, datos) {
    const usuarioExistente = await authRepository.findUserById(userId);
    if (!usuarioExistente) {
        const error = new Error('Usuario no encontrado.');
        error.code = 'USUARIO_NO_ENCONTRADO';
        throw error;
    }

    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    const apellido = typeof datos.apellido === 'string' ? datos.apellido.trim() : '';
    if (!nombre || !apellido) {
        throw crearErrorPerfil('Nombre y apellido son obligatorios.');
    }
    if (nombre.length > 100 || apellido.length > 100) {
        throw crearErrorPerfil('Nombre y apellido no pueden superar los 100 caracteres.');
    }

    let telefono = usuarioExistente.telefono;
    if (datos.telefono !== undefined) {
        if (datos.telefono !== null && typeof datos.telefono !== 'string') {
            throw crearErrorPerfil('El teléfono no es válido.');
        }
        telefono = typeof datos.telefono === 'string' ? datos.telefono.trim() || null : null;
        if (telefono && telefono.length > 30) {
            throw crearErrorPerfil('El teléfono no puede superar los 30 caracteres.');
        }
    }

    let fotoPerfilUrl = null;
    if (datos.foto_perfil !== undefined && datos.foto_perfil !== null && datos.foto_perfil !== '') {
        if (typeof datos.foto_perfil !== 'string') {
            throw crearErrorPerfil('La foto de perfil debe enviarse como texto base64.');
        }

        const { buffer, extension, contentType } = decodificarFotoPerfil(datos.foto_perfil);
        const key = `perfiles/${userId}/${Date.now()}_${uuidv4()}.${extension}`;
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType
        }));

        const region = process.env.AWS_REGION || 'us-east-1';
        fotoPerfilUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    }

    await authRepository.updateUserProfile(
        userId,
        nombre,
        apellido,
        telefono,
        fotoPerfilUrl
    );

    return obtenerPerfil(userId);
}

module.exports = {
    registrarUsuario,
    loginUsuario,
    obtenerPerfil,
    actualizarPerfil
};
