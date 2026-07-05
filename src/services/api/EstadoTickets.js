// src/services/apis/EstadoTickets.js
import { tickets } from './crearticket';

/**
 * Busca tickets por término (ID, boleta o RUT)
 * @param {string} termino - ID, boleta o RUT
 * @returns {Promise<Array>} - Array de tickets encontrados
 */
export const buscarTickets = async (termino) => {
  const terminoLimpio = termino.trim().toUpperCase();
  if (!terminoLimpio) return [];

  try {
    // 1. Obtener todos los tickets
    const allTickets = await tickets.getAll();
    console.log('[buscarTickets] Todos los tickets obtenidos:', allTickets);

    // 2. Normalizar el término de búsqueda (eliminar puntos, espacios y guiones adicionales)
    const terminoNormalizado = terminoLimpio.replace(/\./g, '').replace(/\s/g, '');
    // También conservamos el término con guión para búsqueda por ID exacto
    const terminoConGuion = terminoLimpio; // ya tiene mayúsculas

    // 3. Filtrar tickets
    const encontrados = allTickets.filter(t => {
      // ID del ticket (string)
      const idStr = t.id ? t.id.toString().toUpperCase() : '';
      // Boleta del ticket (string)
      const boletaStr = t.boleta ? t.boleta.toString().toUpperCase() : '';
      // Documento (RUT) normalizado (sin puntos ni espacios)
      const docStr = t.documento ? t.documento.replace(/\./g, '').replace(/\s/g, '').toUpperCase() : '';

      // Condiciones de coincidencia
      const coincideIdExacto = idStr === terminoConGuion;
      const coincideIdPrefijo = idStr.startsWith(terminoConGuion + '-');
      const coincideBoleta = boletaStr === terminoConGuion;
      const coincideDocumento = docStr === terminoNormalizado;

      // Log para depuración
      if (coincideIdExacto || coincideIdPrefijo || coincideBoleta || coincideDocumento) {
        console.log('[buscarTickets] Coincidencia encontrada:', {
          ticket: t.id,
          termino: terminoConGuion,
          coincideIdExacto,
          coincideIdPrefijo,
          coincideBoleta,
          coincideDocumento
        });
      }

      return coincideIdExacto || coincideIdPrefijo || coincideBoleta || coincideDocumento;
    });

    console.log('[buscarTickets] Tickets encontrados:', encontrados.length);
    return encontrados;
  } catch (error) {
    console.error('Error al buscar tickets:', error);
    throw new Error('No se pudieron obtener los tickets. Verifica tu conexión.');
  }
};

/**
 * Busca tickets por término (versión simplificada)
 * @param {string} termino - ID, boleta o RUT
 * @returns {Promise<Array>} - Tickets encontrados
 */
export const buscarTodo = async (termino) => {
  return buscarTickets(termino);
};