const solicitudRepository = require('../repositories/solicitudRepository');
const solicitudService = require('../services/solicitudService');

async function crear(req, res) {
    try {
        const usuario_id = req.user.id;
        const resultado = await solicitudService.crearSolicitud(usuario_id, req.body, req.file);

        res.status(201).json({
            message: 'Solicitud enviada correctamente',
            ...resultado
        });
    } catch (error) {
        if (error.message === 'FALTAN_CAMPOS') {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }
        console.error('Error al guardar la solicitud:', error);
        res.status(500).json({ message: 'Error interno al procesar la solicitud' });
    }
}

async function obtenerPendientes(req, res) {
    try {
        const pendientes = await solicitudRepository.getSolicitudesPendientes();
        res.status(200).json(pendientes);
    } catch (error) {
        console.error('Error al obtener pendientes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}

async function rechazar(req, res) {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        await solicitudRepository.rechazarSolicitud(id, motivo);
        res.status(200).json({ message: 'Solicitud rechazada' });
    } catch (error) {
        console.error('Error al rechazar:', error);
        res.status(500).json({ message: 'Error interno al rechazar la solicitud' });
    }
}

async function obtenerMisSolicitudes(req, res) {
    try {
        const usuario_id = req.user.id;
        const misSolicitudes = await solicitudRepository.getMisSolicitudes(usuario_id);
        res.status(200).json(misSolicitudes);
    } catch (error) {
        console.error('Error al obtener mis solicitudes:', error);
        res.status(500).json({ message: 'Error interno' });
    }
}

async function aprobar(req, res) {
    const { id } = req.params;
    try {
        const credenciales = await solicitudService.aprobarSolicitud(id);
        res.status(200).json({
            message: 'Local aprobado, usuario creado y foto organizada en S3 con éxito.',
            credenciales
        });
    } catch (error) {
        console.error('Error en transacción de aprobación:', error);
        res.status(500).json({ message: error.message || 'Error al aprobar la solicitud' });
    }
}

module.exports = {
    crear,
    obtenerPendientes,
    rechazar,
    obtenerMisSolicitudes,
    aprobar
};