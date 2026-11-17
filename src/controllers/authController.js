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
        // Consultamos directamente la BD con el ID del token para traer nombre, apellido, email, teléfono, etc.
        const usuario = await authService.obtenerPerfil(req.user.id);
        return res.json({ usuario });
    } catch (error) {
        return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
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

async function actualizarDatos(req, res) {
    try {
        const resultado = await authService.actualizarPerfil(req.usuario.id, req.body);
        return res.json(resultado);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

async function cambiarPassword(req, res) {
    try {
        const resultado = await authService.cambiarPassword(req.usuario.id, req.body);
        return res.json(resultado);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

module.exports = {
    register,
    login,
    me,
    obtenerUsuarioPorId,
    actualizarDatos,
    cambiarPassword
};