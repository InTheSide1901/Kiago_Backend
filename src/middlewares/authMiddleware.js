const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/s3');
const pool = require('../config/database');

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Contiene { id, email, rol_id, nombre }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
}
const verificarAuthDuenio = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Token no proporcionado.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
        
        // Obtener usuario de la base de datos para verificar rol actual en tiempo real
        const [rows] = await pool.query('SELECT id, rol_id FROM usuarios WHERE id = ?', [decoded.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const usuario = rows[0];

        // Verificar estrictamente si es Dueño (rol_id = 2)
        if (usuario.rol_id !== 2) {
            return res.status(403).json({ error: 'Acceso denegado. Se requiere cuenta de Dueño (Rol 2).' });
        }

        req.usuario = usuario; // Inyectamos los datos del usuario validado
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = {
    verifyJWT,
    verificarAuthDuenio
};