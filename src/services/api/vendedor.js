// src/services/apis/vendedor.js
import { tickets } from './crearticket';
import { atenciones } from './atenciones';
import { informes } from './informes';

/**
 * Obtiene todos los tickets (sin filtrar, para que el vendedor pueda buscar)
 * @returns {Promise<Array>} - Lista de tickets
 */
export const getTickets = async () => {
  try {
    return await tickets.getAll();
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    throw new Error('No se pudieron obtener los tickets.');
  }
};

/**
 * Obtiene tickets filtrados por texto (ID, boleta, nombres, apellidos)
 * @param {string} filtro - Texto a buscar
 * @returns {Promise<Array>} - Tickets filtrados
 */
export const getTicketsFiltrados = async (filtro) => {
  const texto = filtro.trim().toLowerCase();
  if (!texto) return await getTickets();

  try {
    const allTickets = await tickets.getAll();
    return allTickets.filter(t =>
      t.id && t.id.toString().includes(texto) ||
      (t.boleta && t.boleta.toString().includes(texto)) ||
      (t.nombres && t.nombres.toLowerCase().includes(texto)) ||
      (t.apellidos && t.apellidos.toLowerCase().includes(texto))
    );
  } catch (error) {
    console.error('Error al filtrar tickets:', error);
    throw new Error('No se pudieron filtrar los tickets.');
  }
};

/**
 * Crea una nueva atención de vendedor
 * @param {Object} data - Datos de la atención (vendedor, nombreCliente, apellidoCliente, ticketRelacionado, notas, montoCobro, detalleCobro)
 * @returns {Promise<Object>} - Atención creada
 */
export const crearAtencion = async (data) => {
  try {
    return await atenciones.create(data);
  } catch (error) {
    console.error('Error al crear atención:', error);
    throw error;
  }
};

/**
 * Obtiene las últimas atenciones de un vendedor (últimos 5)
 * @param {string} nombreVendedor - Username del vendedor
 * @returns {Promise<Array>} - Lista de atenciones
 */
export const getUltimasAtenciones = async (nombreVendedor) => {
  try {
    const all = await atenciones.getAll();
    return all
      .filter(a => a.vendedor === nombreVendedor)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5);
  } catch (error) {
    console.error('Error al obtener últimas atenciones:', error);
    throw error;
  }
};

/**
 * Obtiene informes técnicos relacionados con un ticket específico
 * @param {string|number} ticketId - ID del ticket
 * @returns {Promise<Array>} - Lista de informes
 */
export const getInformesPorTicket = async (ticketId) => {
  try {
    const allInformes = await informes.getAll();
    return allInformes
      .filter(inf => inf.ticket === Number(ticketId) || inf.ticket === ticketId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } catch (error) {
    console.error('Error al obtener informes del ticket:', error);
    throw error;
  }
};