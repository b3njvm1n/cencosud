// src/services/api/supervisor.js
import { tickets } from './crearticket';
import { atenciones } from './atenciones';
import { informes } from './informes';
import { materiales } from './materiales';

export const supervisor = {
  // ===== TICKETS =====
  getTickets: async () => {
    try {
      return await tickets.getAll();
    } catch (error) {
      console.error('Error al obtener tickets (supervisor):', error);
      throw error;
    }
  },

  getTicket: async (id) => {
    try {
      return await tickets.get(id);
    } catch (error) {
      console.error(`Error al obtener ticket ${id} (supervisor):`, error);
      throw error;
    }
  },

  actualizarTicket: async (id, estado, comentarioSupervisor = '') => {
    try {
      return await tickets.cambiarEstado(id, estado, comentarioSupervisor);
    } catch (error) {
      console.error(`Error al actualizar ticket ${id} (supervisor):`, error);
      throw error;
    }
  },

  // ===== ATENCIONES =====
  getAtenciones: async () => {
    try {
      return await atenciones.getAll();
    } catch (error) {
      console.error('Error al obtener atenciones (supervisor):', error);
      throw error;
    }
  },

  // ===== INFORMES =====
  getInformes: async () => {
    try {
      return await informes.getAll();
    } catch (error) {
      console.error('Error al obtener informes (supervisor):', error);
      throw error;
    }
  },

  // ===== MATERIALES =====
  getMateriales: async () => {
    try {
      return await materiales.getAll();
    } catch (error) {
      console.error('Error al obtener materiales (supervisor):', error);
      throw error;
    }
  },

  crearMaterial: async (data) => {
    try {
      return await materiales.create(data);
    } catch (error) {
      console.error('Error al crear material (supervisor):', error);
      throw error;
    }
  },

  actualizarMaterial: async (id, data) => {
    try {
      return await materiales.update(id, data);
    } catch (error) {
      console.error(`Error al actualizar material ${id} (supervisor):`, error);
      throw error;
    }
  },

  eliminarMaterial: async (id) => {
    try {
      return await materiales.delete(id);
    } catch (error) {
      console.error(`Error al eliminar material ${id} (supervisor):`, error);
      throw error;
    }
  },
};