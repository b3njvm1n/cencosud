// src/services/apis/crearticket.js
import { apiFetch, apiFetchWithRefresh } from './fetch';

export const tickets = {
  /**
   * Obtiene todos los tickets (con opción de filtros por query params)
   * @param {string} params - Query string (ej: '?estado=resuelto')
   * @returns {Promise<Array>}
   */
  getAll: (params = '') => apiFetchWithRefresh(`/tickets/${params}`),

  /**
   * Obtiene un ticket por su ID
   * @param {string|number} id - ID del ticket
   * @returns {Promise<Object>}
   */
  get: (id) => apiFetchWithRefresh(`/tickets/${id}/`),

  /**
   * Crea un nuevo ticket (público, sin autenticación)
   * @param {Object} data - Datos del ticket (id, nombres, apellidos, etc.)
   * @returns {Promise<Object>}
   */
  create: (data) => apiFetch('/tickets/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Actualiza un ticket completo (PUT) - requiere autenticación
   * @param {string|number} id - ID del ticket
   * @param {Object} data - Datos completos del ticket
   * @returns {Promise<Object>}
   */
  update: (id, data) => apiFetchWithRefresh(`/tickets/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Actualiza parcialmente un ticket (PATCH) - requiere autenticación
   * @param {string|number} id - ID del ticket
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>}
   */
  patch: (id, data) => apiFetchWithRefresh(`/tickets/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /**
   * Elimina un ticket - requiere autenticación
   * @param {string|number} id - ID del ticket
   * @returns {Promise<void>}
   */
  delete: (id) => apiFetchWithRefresh(`/tickets/${id}/`, {
    method: 'DELETE',
  }),

  /**
   * Obtiene estadísticas de tickets - requiere autenticación
   * @returns {Promise<Object>}
   */
  estadisticas: () => apiFetchWithRefresh('/tickets/estadisticas/'),

  /**
   * Cambia el estado y/o comentario de un ticket - requiere autenticación
   * @param {string|number} id - ID del ticket
   * @param {string} estado - Nuevo estado ('abierto', 'progreso', 'resuelto', 'cerrado')
   * @param {string} comentarioSupervisor - Comentario adicional (opcional)
   * @returns {Promise<Object>}
   */
  cambiarEstado: (id, estado, comentarioSupervisor = '') => {
    const payload = { estado };
    if (comentarioSupervisor) payload.comentarioSupervisor = comentarioSupervisor;
    return apiFetchWithRefresh(`/tickets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};