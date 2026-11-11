const localRepository = require('../repositories/localRepository');
const localService = require('../services/localService');

async function getCercanos(req, res) {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radioMetros = parseFloat(req.query.radio) || 500;

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: 'Debes proporcionar una latitud y longitud válidas en la URL.' });
        }

        const resultados = await localService.buscarLocalesCercanos(lat, lng, radioMetros);
        res.json(resultados);
    } catch (error) {
        console.error('Error al buscar locales cercanos:', error);
        res.status(500).json({ error: error.message });
    }
}

async function buscarLocales(req, res) {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.json([]);
        }
        const results = await localRepository.buscarLocalesPorNombre(q);
        res.json(results);
    } catch (error) {
        console.error('Error en la búsqueda de locales:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getCategorias(req, res) {
    try {
        const categorias = await localRepository.getCategorias();
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

async function getLocalesPorCategoria(req, res) {
    try {
        const { categoriaId } = req.params;
        const locales = await localRepository.getLocalesPorCategoria(categoriaId);
        res.json(locales);
    } catch (error) {
        console.error('Error al obtener locales por categoría:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getLocalById(req, res) {
    try {
        const { id } = req.params;
        const local = await localRepository.getLocalById(id);
        if (!local) {
            return res.status(404).json({ mensaje: 'Local no encontrado' });
        }
        res.json(local);
    } catch (error) {
        console.error('Error al obtener el detalle del local:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getAllDatos(req, res) {
    try {
        const results = await localRepository.getAllLocales();
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function crearDato(req, res) {
    try {
        const response = await localService.crearLocalDirecto(req.body, req.file);
        res.json(response);
    } catch (err) {
        console.error('Error al insertar:', err);
        res.status(500).json({ error: err.message });
    }
}

async function actualizarDato(req, res) {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        await localRepository.actualizarLocalNombre(id, nombre);
        res.json({ message: 'Registro actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function eliminarDato(req, res) {
    try {
        const { id } = req.params;
        await localRepository.eliminarLocal(id);
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function obtenerMisLocales(req, res) {
    try {
        const usuarioId = req.user.id; // Extraído directamente del Token JWT
        const locales = await localRepository.getLocalesPorUsuarioId(usuarioId);
        res.status(200).json(locales);
    } catch (error) {
        console.error('Error al obtener los locales del dueño:', error);
        res.status(500).json({ message: 'Error al cargar los locales' });
    }
}
async function obtenerMisLocalesFiltrados(req, res) {
    try {
        const { userID } = req.params;
        const { filtro } = req.params;
        const locales = await localRepository.getLocalesPorUsuarioIdFiltrado(userID, filtro);
        res.status(200).json(locales);
    } catch (error) {
        console.error('Error al obtener los locales filtrados:', error);
        res.status(500).json({ message: 'Error al cargar los locales' });
    }
}
async function obtenerMisLocalesBuscados(req, res) {
    try {
        const { userID } = req.params;
        const { busqueda } = req.params;
        const locales = await localRepository.getLocalesPorUsuarioBuscado(userID, busqueda);
        res.status(200).json(locales);
    } catch (error) {
        console.error('Error al obtener los locales buscados:', error);
        res.status(500).json({ message: 'Error al cargar los locales' });
    }
}
async function obtenerMetricasDashboard(req, res) {
    try {
        const usuarioId = req.user.id;
        const metricas = await localRepository.getMetricasDueño(usuarioId);
        res.status(200).json(metricas);
    } catch (error) {
        console.error('Error al obtener métricas del dashboard:', error);
        res.status(500).json({ message: 'Error al cargar las métricas' });
    }
}

module.exports = {
    getCercanos,
    buscarLocales,
    getCategorias,
    getLocalesPorCategoria,
    getLocalById,
    getAllDatos,
    crearDato,
    actualizarDato,
    eliminarDato,
    obtenerMisLocales,
    obtenerMisLocalesFiltrados,
    obtenerMisLocalesBuscados,
    obtenerMetricasDashboard
};