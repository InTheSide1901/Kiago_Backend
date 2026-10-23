const db = require('../config/database');

async function findUserByEmail(email) {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
}

async function findUserById(id) {
    const [rows] = await db.query(`
        SELECT id, rol_id, nombre, apellido, email, telefono, foto_perfil, created_at 
        FROM usuarios 
        WHERE id = ?
    `, [id]);
    return rows[0];
}

async function createUser(rolId, nombre, apellido, email, passwordHash, telefono) {
    const [result] = await db.query(
        'INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [rolId, nombre, apellido, email, passwordHash, telefono || null]
    );
    return result.insertId;
}

module.exports = {
    findUserByEmail,
    findUserById,
    createUser
};