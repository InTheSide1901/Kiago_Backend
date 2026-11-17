const authService = require('../services/authService');

async function register(req, res) {
    const { nombre, apellido, email, password } = req.body;
    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados.' });
    }

    try {
        const resultado = await authService.registrarUsuario(req.body);
        return res.status(201).json({
            message: 'Usuario registrado exitosamente',
            ...resultado
        });
    } catch (error) {
        if (error.message === 'CORREO_REGISTRADO') {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }
        console.error('Error en registro:', error);
        return res.status(500).json({ message: 'Error interno del servidor al registrar.' });
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Debe proporcionar email y contraseña.' });
    }

    try {
        const resultado = await authService.loginUsuario(email, password);
        return res.json({
            message: 'Inicio de sesión exitoso',
            ...resultado
        });
    } catch (error) {
        if (error.message === 'CREDENCIALES_INVALIDAS') {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
    }
}

async function me(req, res) {
    try {
        const usuario = await authService.obtenerPerfil(req.user.id);
        return res.json({ usuario });
    } catch (error) {
        console.error('Error al consultar perfil:', error.name || 'Error', error.message || 'Error interno');
        return res.status(500).json({ mensaje: 'No se pudo cargar el perfil' });
    }
}

async function actualizarMiPerfil(req, res) {
    try {
        const usuario = await authService.actualizarPerfil(req.user.id, req.body || {});
        return res.status(200).json({
            mensaje: 'Perfil actualizado correctamente',
            usuario
        });
    } catch (error) {
        if (error.code === 'PERFIL_INVALIDO') {
            return res.status(400).json({ mensaje: error.message });
        }
        if (error.code === 'USUARIO_NO_ENCONTRADO') {
            return res.status(404).json({ mensaje: error.message });
        }

        if (error.name === 'ExpiredToken' || error.Code === 'ExpiredToken') {
            console.error('Error al actualizar perfil: las credenciales temporales de S3 expiraron.');
            return res.status(503).json({
                mensaje: 'La sesión temporal de almacenamiento de imágenes expiró. Renueva las credenciales de AWS y reinicia el backend.'
            });
        }

        // No imprimir el objeto completo: errores de AWS pueden incluir tokens y otros datos sensibles.
        console.error('Error al actualizar perfil:', error.name || 'Error', error.message || 'Error interno');
        return res.status(500).json({ mensaje: 'No se pudo actualizar el perfil' });
    }
}

async function obtenerUsuarioPorId(req, res) {
    try {
        const userId = req.params.id;
        const usuario = await authService.obtenerPerfil(userId);
        return res.json(usuario);
    } catch (error) {
        if (error.message === 'USUARIO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = {
    register,
    login,
    me,
    actualizarMiPerfil,
    obtenerUsuarioPorId
};
