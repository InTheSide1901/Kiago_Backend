const favoritoRepository = require('../repositories/favoritoRepository');

async function agregar(user_id, local_id) {
    if (!user_id || !local_id) {
        throw new Error('FALTAN_DATOS');
    }

    const existe = await favoritoRepository.verificarFavorito(user_id, local_id);
    if (existe) {
        return { yaExistia: true, message: 'El local ya está en favoritos.' };
    }

    await favoritoRepository.agregarFavorito(user_id, local_id);
    return { yaExistia: false, message: 'Favorito agregado correctamente.' };
}

module.exports = {
    agregar
};