// src/jsx/useEstadoTicket.jsx
import { useState } from 'react';
import { buscarTodo } from '../services/api/EstadoTickets'; // 👈 Ruta corregida

export const useEstadoTicket = () => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const getEstadoInfo = (ticket) => {
    let visual = ticket.estado_visual;
    if (!visual) {
      if (ticket.estado === 'resuelto') visual = 'resuelto';
      else if (ticket.estado === 'progreso') visual = 'revision';
      else if (ticket.prioridad === 'alta') visual = 'urgente';
      else if (ticket.estado === 'abierto') visual = 'media';
      else visual = 'baja';
    }
    const textos = {
      baja: 'Prioridad baja',
      media: 'Prioridad media',
      urgente: 'Urgente',
      revision: 'En revisión',
      resuelto: 'Resuelto',
    };
    const clases = {
      baja: 'prioridad-baja',
      media: 'prioridad-media',
      urgente: 'prioridad-alta',
      revision: 'prioridad-revision',
      resuelto: 'prioridad-resuelto',
    };
    return {
      texto: textos[visual] || visual,
      clase: clases[visual] || 'prioridad-baja',
    };
  };

  const getBadgeClass = (infoClase) => {
    if (infoClase.includes('baja')) return 'estado-baja';
    if (infoClase.includes('media')) return 'estado-media';
    if (infoClase.includes('alta')) return 'estado-urgente';
    if (infoClase.includes('revision')) return 'estado-revision';
    if (infoClase.includes('resuelto')) return 'estado-resuelto';
    return 'estado-revision';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const busquedaLimpia = busqueda.trim().toUpperCase();
    if (!busquedaLimpia) {
      setError('Por favor ingresa un número de boleta, ID de reclamo o RUT.');
      setResultados([]);
      return;
    }

    setCargando(true);
    setError('');
    setResultados([]);

    try {
      // buscarTodo devuelve un array de tickets (no un objeto con tickets y venta)
      const ticketsEncontrados = await buscarTodo(busquedaLimpia);
      console.log('[useEstadoTicket] Tickets encontrados:', ticketsEncontrados);

      if (ticketsEncontrados && ticketsEncontrados.length > 0) {
        const nuevosResultados = ticketsEncontrados.map(t => ({
          type: 'ticket',
          data: t,
        }));
        setResultados(nuevosResultados);
        setError('');
      } else {
        setError(`No se encontró ningún reclamo con el dato: ${busquedaLimpia}.`);
        setResultados([]);
      }
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      setError('Error al consultar: ' + err.message);
      setResultados([]);
    } finally {
      setCargando(false);
    }
  };

  return {
    busqueda,
    setBusqueda,
    resultados,
    error,
    cargando,
    getEstadoInfo,
    getBadgeClass,
    handleSubmit,
  };
};