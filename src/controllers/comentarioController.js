const comentarioRepository = require('../repositories/comentarioRepository');
const comentarioService = require('../services/comentarioService');

async function crear(req, res) {
    try {
        const usuario_id = req.user.id;
        const resultado = await comentarioService.crearComentario(usuario_id, req.body, req.file);

        return res.status(201).json({
            message: 'Reseña publicada exitosamente',
            ...resultado
        });
    } catch (error) {
        if (error.message === 'FALTAN_DATOS') {
            return res.status(400).json({ message: 'El ID del local y la puntuación son obligatorios.' });
        }
        if (error.message === 'COMMENT_EXISTS') {
            return res.status(400).json({ 
                code: 'COMMENT_EXISTS',
                message: 'Ya has publicado una opinión en este local. Solo se permite un comentario por usuario.' 
            });
        }
        console.error('Error al guardar la reseña:', error);
        return res.status(500).json({ message: 'Error interno del servidor al publicar la reseña' });
    }
}

async function actualizar(req, res) {
    try {
        const comentarioId = req.params.id;
        const usuario_id = req.user.id;

        await comentarioService.actualizarComentario(comentarioId, usuario_id, req.body, req.file);
        return res.json({ message: 'Comentario actualizado correctamente' });
    } catch (error) {
        if (error.message === 'NO_PERMISO') {
            return res.status(403).json({ message: 'No tienes permiso para editar este comentario.' });
        }
        console.error('Error al editar comentario:', error);
        return res.status(500).json({ message: 'Error al actualizar comentario' });
    }
}

async function eliminar(req, res) {
    try {
        const comentarioId = req.params.id;
        const usuario_id = req.user.id;

        const affectedRows = await comentarioRepository.deleteResena(comentarioId, usuario_id);
        if (affectedRows === 0) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este comentario o no existe.' });
        }

        return res.json({ message: 'Comentario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        return res.status(500).json({ message: 'Error al eliminar comentario' });
    }
}

async function obtenerPorLocal(req, res) {
    try {
        const { localId } = req.params;
        const comentarios = await comentarioRepository.getResenasByLocalId(localId);
        res.json(comentarios);
    } catch (error) {
        console.error('Error al obtener los comentarios:', error);
        res.status(500).json({ message: 'Error al cargar los comentarios del local' });
    }
}

module.exports = {
    crear,
    actualizar,
    eliminar,
    obtenerPorLocal
};