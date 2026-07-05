// src/jsx/useVendedor.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTickets,
  getTicketsFiltrados,
  crearAtencion,
  getUltimasAtenciones,
  getInformesPorTicket,
} from '../services/api/vendedor';

export const useVendedor = () => {
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketsFiltrados, setTicketsFiltrados] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [notas, setNotas] = useState('');
  const [montoCobro, setMontoCobro] = useState('');
  const [detalleCobro, setDetalleCobro] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);
  const [notasTecnico, setNotasTecnico] = useState([]); // <--- NUEVO ESTADO

  // ===== LOGS DE DEPURACIÓN =====
  useEffect(() => {
    console.log('[useVendedor] tickets actualizados:', tickets.length);
  }, [tickets]);

  useEffect(() => {
    console.log('[useVendedor] selectedTicket cambiado:', selectedTicket);
  }, [selectedTicket]);

  // ===== AUTENTICACIÓN Y CARGA INICIAL =====
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario_actual') || 'null');
    if (!user || user.rol !== 'vendedor') {
      alert('Acceso denegado. Solo vendedores.');
      navigate('/login');
    } else {
      setUsuarioActual(user);
      cargarDatosIniciales();
    }
  }, [navigate]);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    try {
      const allTickets = await getTickets();
      setTickets(allTickets);
      setTicketsFiltrados(allTickets);
      const ultimas = await getUltimasAtenciones(usuarioActual?.usuario || '');
      setAtenciones(ultimas);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      mostrarMensaje('No se pudieron cargar los datos. Intenta nuevamente.', 'error');
      setTickets([]);
      setTicketsFiltrados([]);
    } finally {
      setCargando(false);
    }
  };

  // ===== CARGA DE NOTAS TÉCNICAS CUANDO CAMBIA EL TICKET SELECCIONADO =====
  useEffect(() => {
    if (!selectedTicketId) {
      setNotasTecnico([]);
      return;
    }
    const cargarNotas = async () => {
      try {
        const notas = await getInformesPorTicket(selectedTicketId);
        setNotasTecnico(notas);
      } catch (error) {
        console.error('Error al cargar notas técnicas:', error);
        setNotasTecnico([]);
      }
    };
    cargarNotas();
  }, [selectedTicketId]);

  // ===== FILTRO DE TICKETS =====
  const handleFiltro = async (e) => {
    const texto = e.target.value;
    setFiltro(texto);
    if (!texto.trim()) {
      const all = await getTickets();
      setTicketsFiltrados(all);
      return;
    }
    try {
      const filtrados = await getTicketsFiltrados(texto);
      setTicketsFiltrados(filtrados);
    } catch (error) {
      console.error('Error al filtrar:', error);
      mostrarMensaje('Error al filtrar los tickets.', 'error');
    }
  };

  // ===== SELECCIÓN DE TICKET =====
  const handleSelectTicket = (e) => {
    const ticketId = e.target.value;
    setSelectedTicketId(ticketId);
    if (!ticketId) {
      setSelectedTicket(null);
      setNombre('');
      setApellido('');
      setNotasTecnico([]);
      return;
    }
    const ticket = (tickets || []).find(t => t.id?.toString() === ticketId.toString());
    if (ticket) {
      setSelectedTicket(ticket);
      setNombre(ticket.nombres || '');
      setApellido(ticket.apellidos || '');
    } else {
      setSelectedTicket(null);
      mostrarMensaje('Ticket no encontrado', 'error');
    }
  };

  // ===== FUNCIONES AUXILIARES DE ESTADO =====
  const getEstadoVisual = (ticket) => {
    if (!ticket) return 'baja';
    let visual = ticket.estado_visual;
    if (!visual) {
      if (ticket.estado === 'resuelto') visual = 'resuelto';
      else if (ticket.estado === 'progreso') visual = 'revision';
      else if (ticket.prioridad === 'alta') visual = 'urgente';
      else if (ticket.estado === 'abierto') visual = 'media';
      else visual = 'baja';
    }
    return visual;
  };

  const getEstadoTexto = (visual) => {
    const map = { baja: 'Prioridad baja', media: 'Prioridad media', urgente: 'Urgente', revision: 'En revisión', resuelto: 'Resuelto' };
    return map[visual] || visual;
  };

  const getEstadoClase = (visual) => {
    const map = { baja: 'estado-baja', media: 'estado-media', urgente: 'estado-urgente', revision: 'estado-revision', resuelto: 'estado-resuelto' };
    return map[visual] || '';
  };

  // ===== GUARDAR ATENCIÓN =====
  const guardarAtencion = async () => {
    if (!nombre || !apellido) {
      mostrarMensaje('Debes ingresar nombre y apellido del cliente', 'error');
      return;
    }
    if (!notas) {
      mostrarMensaje('Debes escribir las notas de la atención', 'error');
      return;
    }
    const monto = parseFloat(montoCobro);
    if (isNaN(monto) || monto <= 0) {
      mostrarMensaje('Debes ingresar un monto de cobro válido (mayor a cero)', 'error');
      return;
    }
    if (!detalleCobro) {
      mostrarMensaje('Debes especificar el detalle del cobro', 'error');
      return;
    }

    setCargando(true);
    try {
      const nuevaAtencion = {
        nombreCliente: nombre,
        apellidoCliente: apellido,
        ticketRelacionado: selectedTicket ? selectedTicket.id : null,
        notas: notas,
        montoCobro: monto,
        detalleCobro: detalleCobro,
      };

      await crearAtencion(nuevaAtencion);
      mostrarMensaje(`✅ Atención guardada correctamente. Cobro de $${monto.toLocaleString()} registrado.`, 'exito');

      const ultimas = await getUltimasAtenciones(usuarioActual.usuario);
      setAtenciones(ultimas);

      setNotas('');
      setMontoCobro('');
      setDetalleCobro('');
    } catch (error) {
      console.error('Error al guardar atención:', error);
      mostrarMensaje('Error al guardar la atención. Intenta nuevamente.', 'error');
    } finally {
      setCargando(false);
    }
  };

  // ===== MOSTRAR MENSAJE =====
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
  };

  // ===== CERRAR SESIÓN =====
  const cerrarSesion = () => {
    localStorage.removeItem('usuario_actual');
    navigate('/login');
  };

  // ===== LIMPIAR FORMULARIO DE ATENCIÓN =====
  const limpiarFormularioAtencion = () => {
    setNotas('');
    setMontoCobro('');
    setDetalleCobro('');
  };

  return {
    usuarioActual,
    ticketsFiltrados,
    selectedTicketId,
    selectedTicket,
    nombre,
    apellido,
    notas,
    montoCobro,
    detalleCobro,
    mensaje,
    atenciones,
    filtro,
    cargando,
    notasTecnico, // <--- EXPUESTO PARA LA VISTA
    setNombre,
    setApellido,
    setNotas,
    setMontoCobro,
    setDetalleCobro,
    handleFiltro,
    handleSelectTicket,
    guardarAtencion,
    cerrarSesion,
    limpiarFormularioAtencion,
    getEstadoVisual,
    getEstadoTexto,
    getEstadoClase,
  };
};