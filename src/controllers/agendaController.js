
const agendaService = require('../services/agendaService');


// GET: obtener agenda del usuario
const obtenerAgenda = async (req, res) => {

    try {

        const usuarioId = req.user.id;

        const agenda = await agendaService.obtenerAgenda(usuarioId);

        return res.status(200).json({
            mensaje: 'Agenda obtenida correctamente',
            agenda
        });

    } catch (error) {

        console.error('Error al obtener agenda:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener la agenda'
        });
    }
};


// POST: agendar un lugar
const agendarLugar = async (req, res) => {

    try {

        const usuarioId = req.user.id;

        const { local_id, fecha_visita } = req.body;

        const nuevoEvento = await agendaService.agendarLugar(
            usuarioId,
            local_id,
            fecha_visita
        );

        return res.status(201).json({
            mensaje: 'Lugar agendado correctamente',
            agenda_id: nuevoEvento
        });

    } catch (error) {

        console.error('Error al agendar lugar:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                mensaje: 'Este lugar ya está agendado para esa fecha'
            });
        }

        if (error.message === 'El lugar solicitado no existe') {
            return res.status(404).json({
                mensaje: error.message
            });
        }

        if (
            error.message === 'El ID del lugar no es válido' ||
            error.message === 'La fecha no tiene un formato válido' ||
            error.message === 'La fecha ingresada no existe'
        ) {
            return res.status(400).json({
                mensaje: error.message
            });
        }

        return res.status(500).json({
            mensaje: 'Error al intentar agendar el lugar'
        });
    }
};


// DELETE: eliminar una visita de la agenda del usuario
const eliminarLugar = async (req, res) => {

    try {
        const usuarioId = req.user.id;
        const eliminado = await agendaService.eliminarLugar(usuarioId, req.params.id);

        if (!eliminado) {
            return res.status(404).json({
                mensaje: 'La visita no existe en tu agenda'
            });
        }

        return res.status(200).json({
            mensaje: 'Visita eliminada correctamente'
        });

    } catch (error) {
        if (error.message === 'El ID de la visita no es válido') {
            return res.status(400).json({ mensaje: error.message });
        }

        console.error('Error al eliminar visita de agenda:', error);
        return res.status(500).json({
            mensaje: 'Error al eliminar la visita de la agenda'
        });
    }
};


module.exports = {
    obtenerAgenda,
    agendarLugar,
    eliminarLugar
};
