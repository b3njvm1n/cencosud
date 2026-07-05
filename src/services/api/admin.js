// src/services/api/admin.js
import { tickets } from './tickets';
import { atenciones } from './atenciones';
import { ventas } from './ventas';
import { materiales } from './materiales';
import { usuarios } from './usuarios';
import { apiFetchWithRefresh } from './fetch';

// Helper para manejar errores de forma consistente
const handleError = (error, context) => {
  console.error(`[admin] Error en ${context}:`, error);
  throw error;
};

export const admin = {
  /**
   * Obtiene todas las métricas del dashboard en una sola llamada
   * @returns {Promise<Object>} - Datos del dashboard
   */
  getDashboard: async () => {
    try {
      return await apiFetchWithRefresh('/admin/dashboard/');
    } catch (error) {
      handleError(error, 'getDashboard');
    }
  },

  /**
   * Obtiene todos los tickets (para el admin)
   * @returns {Promise<Array>}
   */
  getTickets: async () => {
    try {
      return await tickets.getAll();
    } catch (error) {
      handleError(error, 'getTickets');
    }
  },

  /**
   * Actualiza un ticket (PATCH)
   * @param {string|number} id - ID del ticket
   * @param {Object} data - Datos a actualizar (ej. estado, comentario)
   * @returns {Promise<Object>}
   */
  actualizarTicket: async (id, data) => {
    try {
      return await tickets.patch(id, data);
    } catch (error) {
      handleError(error, `actualizarTicket(${id})`);
    }
  },

  /**
   * Obtiene todas las atenciones
   * @returns {Promise<Array>}
   */
  getAtenciones: async () => {
    try {
      return await atenciones.getAll();
    } catch (error) {
      handleError(error, 'getAtenciones');
    }
  },

  /**
   * Obtiene todas las ventas
   * @returns {Promise<Array>}
   */
  getVentas: async () => {
    try {
      return await ventas.getAll();
    } catch (error) {
      handleError(error, 'getVentas');
    }
  },

  /**
   * Obtiene todos los materiales
   * @returns {Promise<Array>}
   */
  getMateriales: async () => {
    try {
      return await materiales.getAll();
    } catch (error) {
      handleError(error, 'getMateriales');
    }
  },

  /**
   * Obtiene todos los usuarios
   * @returns {Promise<Array>}
   */
  getUsuarios: async () => {
    try {
      return await usuarios.getAll();
    } catch (error) {
      handleError(error, 'getUsuarios');
    }
  },

  /**
   * Crea un nuevo usuario (solo administrador)
   * @param {Object} data - { username, password, rol }
   * @returns {Promise<Object>}
   */
  crearUsuario: async (data) => {
    try {
      return await usuarios.create(data);
    } catch (error) {
      handleError(error, 'crearUsuario');
    }
  },

  /**
   * Elimina un usuario por ID
   * @param {string|number} id - ID del usuario
   * @returns {Promise<void>}
   */
  eliminarUsuario: async (id) => {
    try {
      return await usuarios.delete(id);
    } catch (error) {
      handleError(error, `eliminarUsuario(${id})`);
    }
  },
};