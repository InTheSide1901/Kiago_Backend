const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');
const { JWT_SECRET } = require('../config/s3');
const { authRepoDuenio, findUserById } = require('../repositories/authRepository');

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

    return { token, usuario: userData };
}

async function obtenerPerfil(userId) {
    const usuario = await authRepository.findUserById(userId);
    if (!usuario) {
        throw new Error('USUARIO_NO_ENCONTRADO');
    }
    return usuario;
}

async function actualizarPerfil(id, datos) {
    const actualizado = await authRepoDuenio.actualizarDatosPersonales(id, datos);
    if (!actualizado) {
        throw new Error('No se pudo actualizar el perfil o el usuario no es dueño.');
    }
    return { mensaje: 'Datos personales actualizados correctamente.' };
}

async function cambiarPassword(id, { passActual, passNueva }) {
    const usuario = await authRepoDuenio.obtenerPorId(id); // Valida rol_id = 2
    if (!usuario) {
        throw new Error('Usuario no encontrado o no autorizado.');
    }

    const passwordValida = await bcrypt.compare(passActual, usuario.password_hash);
    if (!passwordValida) {
        throw new Error('La contraseña actual es incorrecta.');
    }

    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(passNueva, salt);

    await authRepoDuenio.actualizarPassword(id, nuevoHash);
    return { mensaje: 'Contraseña actualizada correctamente.' };
}

module.exports = {
    registrarUsuario,
    loginUsuario,
    obtenerPerfil,
    actualizarPerfil,
    cambiarPassword,
    authRepoDuenio
};