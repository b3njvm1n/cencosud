// src/services/apis/tecnico.js
import { tickets } from './crearticket';
import { informes } from './informes';

/**
 * Obtiene todos los tickets pendientes (no resueltos)
 * @returns {Promise<Array>} - Lista de tickets con estado_visual !== 'resuelto'
 */
export const getTicketsPendientes = async () => {
  try {
    const allTickets = await tickets.getAll();
    // Filtrar tickets que no estén resueltos
    return allTickets.filter(t => {
      const visual = t.estado_visual || (t.estado === 'resuelto' ? 'resuelto' :
        (t.estado === 'progreso' ? 'revision' :
        (t.prioridad === 'alta' ? 'urgente' : 'media')));
      return visual !== 'resuelto';
    });
  } catch (error) {
    console.error('Error al obtener tickets pendientes:', error);
    throw new Error('No se pudieron obtener los tickets pendientes.');
  }
};

/**
 * Obtiene un ticket por su ID
 * @param {string|number} id - ID del ticket
 * @returns {Promise<Object>} - Datos del ticket
 */
export const getTicket = async (id) => {
  try {
    return await tickets.get(id);
  } catch (error) {
    console.error(`Error al obtener ticket ${id}:`, error);
    throw error;
  }
};

/**
 * Actualiza el estado visual de un ticket
 * @param {string|number} ticketId - ID del ticket
 * @param {string} estadoVisual - 'baja', 'media', 'urgente', 'revision', 'resuelto'
 * @returns {Promise<Object>} - Ticket actualizado
 */
export const actualizarEstadoTicket = async (ticketId, estadoVisual) => {
  // Mapeo de estado_visual a estado y prioridad
  let estado, prioridad;
  switch (estadoVisual) {
    case 'baja':
      estado = 'abierto';
      prioridad = 'baja';
      break;
    case 'media':
      estado = 'abierto';
      prioridad = 'media';
      break;
    case 'urgente':
      estado = 'abierto';
      prioridad = 'alta';
      break;
    case 'revision':
      estado = 'progreso';
      prioridad = 'media';
      break;
    case 'resuelto':
      estado = 'resuelto';
      prioridad = 'media';
      break;
    default:
      estado = 'abierto';
      prioridad = 'media';
  }

  try {
    const response = await tickets.patch(ticketId, {
      estado,
      prioridad,
      estado_visual: estadoVisual,
    });
    return response;
  } catch (error) {
    console.error(`Error al actualizar estado del ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Guarda un informe técnico y actualiza el estado del ticket según la corrección.
 * El campo 'tecnico' se asigna automáticamente en el backend (usuario autenticado).
 * @param {Object} data - Datos del informe (ticketId, nombreAsistido, apellidoAsistido, explicacion, correccion)
 * @returns {Promise<Object>} - Informe creado
 */
export const guardarInformeTecnico = async (data) => {
  const { ticketId, nombreAsistido, apellidoAsistido, explicacion, correccion } = data;

  try {
    // 1. Crear el informe técnico (sin tecnico, el backend lo asigna)
    const informePayload = {
      ticket: ticketId,
      nombreAsistido,
      apellidoAsistido,
      explicacion,
      correccion,
      // fecha se asigna automáticamente en el backend
    };
    const nuevoInforme = await informes.create(informePayload);

    // 2. Determinar nuevo estado según corrección
    let estado = 'abierto';
    let prioridad = 'media';
    let estadoVisual = 'media';

    switch (correccion) {
      case 'si':
        estado = 'resuelto';
        prioridad = 'media';
        estadoVisual = 'resuelto';
        break;
      case 'parcial':
        estado = 'progreso';
        prioridad = 'media';
        estadoVisual = 'revision';
        break;
      case 'no':
        estado = 'abierto';
        prioridad = 'media';
        estadoVisual = 'media';
        break;
      default:
        estado = 'abierto';
        prioridad = 'media';
        estadoVisual = 'media';
    }

    // 3. Actualizar el estado del ticket
    await tickets.patch(ticketId, {
      estado,
      prioridad,
      estado_visual: estadoVisual,
    });

    return nuevoInforme;
  } catch (error) {
    console.error('Error al guardar informe técnico:', error);
    throw error;
  }
};

/**
 * Obtiene todos los informes técnicos de un ticket específico
 * @param {string|number} ticketId - ID del ticket
 * @returns {Promise<Array>} - Lista de informes ordenados por fecha descendente
 */
export const getInformesPorTicket = async (ticketId) => {
  try {
    const allInformes = await informes.getAll();
    return allInformes
      .filter(inf => inf.ticket === Number(ticketId) || inf.ticket === ticketId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } catch (error) {
    console.error(`Error al obtener informes del ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Obtiene los últimos informes (últimos 5) para el dashboard del técnico
 * @returns {Promise<Array>} - Últimos informes ordenados por fecha descendente
 */
export const getUltimosInformes = async () => {
  try {
    const allInformes = await informes.getAll();
    return allInformes
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5);
  } catch (error) {
    console.error('Error al obtener últimos informes:', error);
    throw error;
  }
};