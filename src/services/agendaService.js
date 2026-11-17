
const agendaRepository = require('../repositories/agendaRepository');


// Obtener agenda del usuario
const obtenerAgenda = async (usuarioId) => {

    const agenda = await agendaRepository.obtenerAgendaPorUsuario(usuarioId);

    return agenda;
};


// Crear un evento en agenda
const agendarLugar = async (usuarioId, localId, fechaVisita) => {

    // Validar ID del lugar
    if (!Number.isInteger(localId) || localId <= 0) {
        throw new Error('El ID del lugar no es válido');
    }

    // Validar formato y existencia de la fecha
    if (
        typeof fechaVisita !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaVisita)
    ) {
        throw new Error('La fecha no tiene un formato válido');
    }

    const fecha = new Date(`${fechaVisita}T00:00:00Z`);

    if (
        Number.isNaN(fecha.getTime()) ||
        fecha.toISOString().slice(0, 10) !== fechaVisita
    ) {
        throw new Error('La fecha ingresada no existe');
    }

    // Verificar que el lugar exista
    const localExiste = await agendaRepository.existeLocal(localId);

    if (!localExiste) {
        throw new Error('El lugar solicitado no existe');
    }

    // Crear evento
    const nuevoEvento = await agendaRepository.crearEvento(
        usuarioId,
        localId,
        fechaVisita
    );

    return nuevoEvento;
};


// Eliminar una visita solo si pertenece al usuario autenticado
const eliminarLugar = async (usuarioId, agendaId) => {
    const id = Number(agendaId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('El ID de la visita no es válido');
    }

    return agendaRepository.eliminarEvento(usuarioId, id);
};


module.exports = {
    obtenerAgenda,
    agendarLugar,
    eliminarLugar
};
