// src/jsx/useTecnico.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTicketsPendientes,
  getTicket,
  actualizarEstadoTicket,
  guardarInformeTecnico,
  getUltimosInformes,
} from '../services/api/tecnico';

export const useTecnico = () => {
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [nombreAsistido, setNombreAsistido] = useState('');
  const [apellidoAsistido, setApellidoAsistido] = useState('');
  const [explicacion, setExplicacion] = useState('');
  const [correccion, setCorreccion] = useState('');
  const [estadoVisual, setEstadoVisual] = useState('revision');
  const [informes, setInformes] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // ===== AUTENTICACIÓN Y CARGA INICIAL =====
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario_actual') || 'null');
    if (!user || user.rol !== 'tecnico') {
      alert('Acceso denegado. Solo técnicos.');
      navigate('/login');
    } else {
      setUsuarioActual(user);
      cargarDatosIniciales();
    }
  }, [navigate]);

  const cargarDatosIniciales = async () => {
    try {
      const pendientes = await getTicketsPendientes();
      setPendingTickets(pendientes);
      const ultimos = await getUltimosInformes();
      setInformes(ultimos);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      mostrarMensaje('No se pudieron cargar los datos. Intenta nuevamente.', 'error');
    }
  };

  // ===== FUNCIÓN AUXILIAR: Mostrar mensaje =====
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  // ===== OBTENER TICKET SELECCIONADO =====
  const handleTicketSelect = async (e) => {
    const ticketId = e.target.value;
    setSelectedTicketId(ticketId);
    if (!ticketId) {
      setSelectedTicket(null);
      setNombreAsistido('');
      setApellidoAsistido('');
      setExplicacion('');
      setEstadoVisual('revision');
      return;
    }

    try {
      const ticket = await getTicket(ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setNombreAsistido(ticket.nombres || '');
        setApellidoAsistido(ticket.apellidos || '');
        setExplicacion('');
        let visual = ticket.estado_visual;
        if (!visual) {
          if (ticket.estado === 'resuelto') visual = 'resuelto';
          else if (ticket.estado === 'progreso') visual = 'revision';
          else if (ticket.prioridad === 'alta') visual = 'urgente';
          else if (ticket.estado === 'abierto') visual = 'media';
          else visual = 'baja';
        }
        setEstadoVisual(visual);
      } else {
        mostrarMensaje('No se encontró el ticket seleccionado.', 'error');
      }
    } catch (error) {
      console.error('Error al obtener ticket:', error);
      mostrarMensaje('Error al cargar el ticket. Verifica tu conexión.', 'error');
    }
  };

  // ===== ACTUALIZAR ESTADO VISUAL =====
  const actualizarEstado = async () => {
    if (!selectedTicket) {
      mostrarMensaje('Primero selecciona un reclamo', 'error');
      return;
    }

    try {
      await actualizarEstadoTicket(selectedTicket.id, estadoVisual);
      mostrarMensaje('Estado actualizado correctamente', 'exito');

      await cargarDatosIniciales();
      if (estadoVisual !== 'resuelto') {
        const ticketActualizado = await getTicket(selectedTicket.id);
        setSelectedTicket(ticketActualizado);
      } else {
        setSelectedTicket(null);
        setSelectedTicketId('');
        setNombreAsistido('');
        setApellidoAsistido('');
        setExplicacion('');
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      mostrarMensaje('Error al actualizar estado. Intenta nuevamente.', 'error');
    }
  };

  // ===== GUARDAR INFORME TÉCNICO =====
  const guardarInforme = async () => {
    if (!selectedTicket) {
      mostrarMensaje('Debes seleccionar un reclamo', 'error');
      return;
    }
    if (!nombreAsistido || !apellidoAsistido || !explicacion || !correccion) {
      mostrarMensaje('Todos los campos del informe son obligatorios', 'error');
      return;
    }

    try {
      // Datos para el informe (sin tecnico, el backend lo asigna)
      const data = {
        ticketId: selectedTicket.id,
        nombreAsistido,
        apellidoAsistido,
        explicacion,
        correccion,
      };

      await guardarInformeTecnico(data);
      mostrarMensaje('Informe guardado correctamente', 'exito');

      await cargarDatosIniciales();
      limpiarFormulario();

      if (correccion === 'si') {
        setSelectedTicket(null);
        setSelectedTicketId('');
        setEstadoVisual('revision');
      } else {
        const ticketActualizado = await getTicket(selectedTicket.id);
        setSelectedTicket(ticketActualizado);
        let visual = ticketActualizado.estado_visual;
        if (!visual) {
          if (ticketActualizado.estado === 'resuelto') visual = 'resuelto';
          else if (ticketActualizado.estado === 'progreso') visual = 'revision';
          else if (ticketActualizado.prioridad === 'alta') visual = 'urgente';
          else if (ticketActualizado.estado === 'abierto') visual = 'media';
          else visual = 'baja';
        }
        setEstadoVisual(visual);
      }
    } catch (error) {
      console.error('Error al guardar informe:', error);
      mostrarMensaje('Error al guardar el informe. Intenta nuevamente.', 'error');
    }
  };

  // ===== LIMPIAR FORMULARIO =====
  const limpiarFormulario = () => {
    setNombreAsistido('');
    setApellidoAsistido('');
    setExplicacion('');
    setCorreccion('');
  };

  // ===== CERRAR SESIÓN =====
  const cerrarSesion = () => {
    localStorage.removeItem('usuario_actual');
    navigate('/login');
  };

  // ===== FUNCIÓN AUXILIAR PARA TEXTO DE ESTADO VISUAL =====
  const getEstadoVisualTexto = (visual) => {
    const map = { baja: 'Prioridad baja', media: 'Prioridad media', urgente: 'Urgente', revision: 'En revisión', resuelto: 'Resuelto' };
    return map[visual] || visual;
  };

  // ===== EXPOSICIÓN =====
  return {
    usuarioActual,
    pendingTickets,
    selectedTicketId,
    selectedTicket,
    nombreAsistido,
    apellidoAsistido,
    explicacion,
    correccion,
    estadoVisual,
    informes,
    mensaje,
    setNombreAsistido,
    setApellidoAsistido,
    setExplicacion,
    setCorreccion,
    setEstadoVisual,
    handleTicketSelect,
    actualizarEstado,
    guardarInforme,
    limpiarFormulario,
    cerrarSesion,
    getEstadoVisualTexto,
  };
};