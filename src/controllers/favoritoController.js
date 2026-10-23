const favoritoRepository = require('../repositories/favoritoRepository');
const favoritoService = require('../services/favoritoService');

async function agregarFavorito(req, res) {
    const { user_id, local_id } = req.body;
    try {
        const resultado = await favoritoService.agregar(user_id, local_id);
        const status = resultado.yaExistia ? 200 : 201;
        return res.status(status).json({ message: resultado.message });
    } catch (error) {
        if (error.message === 'FALTAN_DATOS') {
            return res.status(400).json({ message: 'Falta el ID del usuario o del local.' });
        }
        console.error('Error al agregar favorito:', error);
        return res.status(500).json({ message: 'Error interno al agregar favorito.' });
    }
}

async function eliminarFavorito(req, res) {
    const { user_id, local_id } = req.body;
    if (!user_id || !local_id) {
        return res.status(400).json({ message: 'Falta el ID del usuario o del local.' });
    }

    try {
        const affectedRows = await favoritoRepository.eliminarFavorito(user_id, local_id);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'El favorito no existe.' });
        }
        return res.status(200).json({ message: 'Favorito eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar favorito:', error);
        return res.status(500).json({ message: 'Error interno al eliminar favorito.' });
    }
}

async function consultarFavorito(req, res) {
    const { usuario_id, local_id } = req.params;
    try {
        const esFavorito = await favoritoRepository.verificarFavorito(usuario_id, local_id);
        return res.status(200).json({ esFavorito });
    } catch (error) {
        console.error('Error al consultar favorito:', error);
        return res.status(500).json({ message: 'Error interno al consultar favorito.' });
    }
}

async function consultarTodosFavoritos(req, res) {
    const usuario_id = Number(req.params.usuario_id);
    if (!Number.isInteger(usuario_id) || usuario_id <= 0) {
        return res.status(400).json({ message: 'El ID del usuario no es válido.' });
    }

    try {
        const favoritos = await favoritoRepository.getFavoritosByUsuarioId(usuario_id);
        return res.status(200).json({ favoritos });
    } catch (error) {
        console.error('Error al consultar favoritos:', error);
        return res.status(500).json({ message: 'Error interno al consultar favoritos.' });
    }
}

module.exports = {
    agregarFavorito,
    eliminarFavorito,
    consultarFavorito,
    consultarTodosFavoritos
};