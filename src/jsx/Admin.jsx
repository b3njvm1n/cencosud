// src/jsx/useAdmin.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tickets, atenciones, ventas, materiales, usuarios, registrarUsuario } from '../services/api';

export const useAdmin = () => {
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ticketsList, setTicketsList] = useState([]);
  const [atencionesList, setAtencionesList] = useState([]);
  const [ventasList, setVentasList] = useState([]);
  const [materialesList, setMaterialesList] = useState([]);
  const [usuariosList, setUsuariosList] = useState([]);
  const [filtroTickets, setFiltroTickets] = useState('');
  const [sortTicket, setSortTicket] = useState({ field: 'fecha', direction: 'desc' });
  const [sortReparacion, setSortReparacion] = useState({ field: 'fecha', direction: 'desc' });
  const [sortUsuario, setSortUsuario] = useState({ field: 'username', direction: 'asc' });
  const [editingTicket, setEditingTicket] = useState(null);
  const [modalTicketOpen, setModalTicketOpen] = useState(false);
  // Nuevos estados para el modal de ticket
  const [estadoAbierto, setEstadoAbierto] = useState(true);
  const [nuevoEstadoVisual, setNuevoEstadoVisual] = useState('revision');
  const [comentarioTicket, setComentarioTicket] = useState('');
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [formUsuario, setFormUsuario] = useState({ usuario: '', password: '', rol: 'vendedor' });
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [cargando, setCargando] = useState(false);

  // ===== CARGAR TODOS LOS DATOS (INDEPENDIENTEMENTE) =====
  const cargarDatos = async () => {
    setCargando(true);
    try {
      console.log('[useAdmin] 🔄 Iniciando carga de datos...');

      const [ticketsData, atencionesData, ventasData, materialesData, usuariosData] = await Promise.all([
        tickets.getAll().catch(err => {
          console.warn('[useAdmin] ⚠️ Error al cargar tickets:', err);
          return [];
        }),
        atenciones.getAll().catch(err => {
          console.warn('[useAdmin] ⚠️ Error al cargar atenciones:', err);
          return [];
        }),
        ventas.getAll().catch(err => {
          console.warn('[useAdmin] ⚠️ Error al cargar ventas (endpoint no existe o error):', err);
          return [];
        }),
        materiales.getAll().catch(err => {
          console.warn('[useAdmin] ⚠️ Error al cargar materiales:', err);
          return [];
        }),
        usuarios.getAll().catch(err => {
          console.warn('[useAdmin] ⚠️ Error al cargar usuarios:', err);
          return [];
        }),
      ]);

      console.log('[useAdmin] 📦 Tickets recibidos:', ticketsData?.length);
      console.log('[useAdmin] 📦 Materiales recibidos:', materialesData?.length);
      console.log('[useAdmin] 📦 Usuarios recibidos:', usuariosData?.length);

      setTicketsList(Array.isArray(ticketsData) ? ticketsData : []);
      setAtencionesList(Array.isArray(atencionesData) ? atencionesData : []);
      setVentasList(Array.isArray(ventasData) ? ventasData : []);
      setMaterialesList(Array.isArray(materialesData) ? materialesData : []);
      setUsuariosList(Array.isArray(usuariosData) ? usuariosData : []);

      console.log('[useAdmin] ✅ Estados actualizados.');
    } catch (error) {
      console.error('[useAdmin] ❌ Error inesperado:', error);
      alert('No se pudieron cargar los datos. Verifica tu conexión.');
      setTicketsList([]);
      setAtencionesList([]);
      setVentasList([]);
      setMaterialesList([]);
      setUsuariosList([]);
    } finally {
      setCargando(false);
      console.log('[useAdmin] 🔄 Carga finalizada.');
    }
  };

  // ===== MONITOREO DE CAMBIOS =====
  useEffect(() => {
    console.log('[useAdmin] 🟢 materialesList cambió:', materialesList.length);
  }, [materialesList]);

  useEffect(() => {
    console.log('[useAdmin] 🟢 ticketsList cambió:', ticketsList.length);
  }, [ticketsList]);

  // ===== AUTENTICACIÓN =====
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario_actual') || 'null');
    if (!user || user.rol !== 'administrador') {
      alert('Acceso denegado. Solo administradores.');
      navigate('/login');
    } else {
      setUsuarioActual(user);
      cargarDatos();
    }
  }, [navigate]);

  // ===== DASHBOARD (calculado localmente con conversión a número) =====
  const getDashboardData = () => {
    const hoy = new Date().toDateString();
    const reparacionesHoy = atencionesList.filter(a => new Date(a.fecha).toDateString() === hoy);
    const ingresosCobros = reparacionesHoy.reduce((sum, a) => sum + (Number(a.montoCobro) || 0), 0);
    const ventasHoy = Array.isArray(ventasList) 
      ? ventasList.filter(v => new Date(v.fecha).toDateString() === hoy && v.estado !== 'anulada')
      : [];
    const ingresosVentas = ventasHoy.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const ingresosTotales = ingresosCobros + ingresosVentas;
    const abiertos = ticketsList.filter(t => t.estado === 'abierto' || t.estado === 'progreso').length;
    const gastoHoy = materialesList
      .filter(m => new Date(m.fecha).toDateString() === hoy)
      .reduce((sum, m) => sum + (Number(m.cantidad) * Number(m.costoUnitario) || 0), 0);
    const totalMateriales = materialesList.length;
    const ultimasReparaciones = [...atencionesList].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);
    return {
      reparacionesHoy: reparacionesHoy.length,
      ingresosTotales,
      abiertos,
      gastoHoy,
      totalMateriales,
      ultimasReparaciones,
    };
  };

  const dashboard = getDashboardData();

  // ===== FUNCIONES AUXILIARES (TICKETS) =====
  const getEstadoVisual = (ticket) => {
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

  // ===== TEXTO DE ESTADO (ACTUALIZADO) =====
  const getEstadoTexto = (ticket) => {
    const map = {
      baja: 'Prioridad baja',
      media: 'Prioridad media',
      urgente: 'Prioridad alta',
      revision: 'Revisión',
      resuelto: 'Resuelto',
    };
    return map[getEstadoVisual(ticket)] || 'Desconocido';
  };

  const getEstadoClase = (ticket) => {
    const map = {
      baja: 'estado-baja',
      media: 'estado-media',
      urgente: 'estado-urgente',
      revision: 'estado-revision',
      resuelto: 'estado-resuelto',
    };
    return map[getEstadoVisual(ticket)] || '';
  };

  const getEstadoSortKey = (ticket) => {
    const order = { revision: 0, baja: 1, media: 2, urgente: 3, resuelto: 4 };
    return order[getEstadoVisual(ticket)] ?? 99;
  };

  const getCobroInfo = (ticketId) => {
    const relacionadas = atencionesList.filter(a => a.ticketRelacionado === ticketId && a.montoCobro > 0);
    let total = 0;
    let detalles = [];
    relacionadas.forEach(a => {
      total += Number(a.montoCobro) || 0;
      if (a.detalleCobro) detalles.push(a.detalleCobro);
    });
    const texto = total > 0 ? `$${total.toLocaleString()} - ${detalles.join(', ') || 'Sin detalle'}` : 'Sin cobro';
    return { total, texto };
  };

  // ===== ORDENAMIENTOS =====
  const ordenarTickets = (items, field, direction) => {
    const getValue = (item, f) => {
      switch (f) {
        case 'id': return item.id;
        case 'fecha': return new Date(item.fecha);
        case 'cliente': return `${item.nombres} ${item.apellidos}`.toLowerCase();
        case 'categoria': return item.categoria?.toLowerCase() || '';
        case 'producto': return item.producto?.toLowerCase() || '';
        case 'estado': return getEstadoSortKey(item);
        case 'cobro': return getCobroInfo(item.id).total;
        default: return '';
      }
    };
    return [...items].sort((a, b) => {
      let va = getValue(a, field);
      let vb = getValue(b, field);
      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSortTicket = (field) => {
    setSortTicket((prev) => ({
      field,
      direction: prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : (field === 'fecha' ? 'desc' : 'asc'),
    }));
  };

  const ordenarReparaciones = (items, field, direction) => {
    const getValue = (item, f) => {
      if (f === 'fecha') return new Date(item.fecha);
      if (f === 'vendedor') return item.vendedor?.toLowerCase() || '';
      if (f === 'cliente') return `${item.nombreCliente} ${item.apellidoCliente}`.toLowerCase();
      if (f === 'cobro') return Number(item.montoCobro) || 0;
      return '';
    };
    return [...items].sort((a, b) => {
      let va = getValue(a, field);
      let vb = getValue(b, field);
      if (field === 'cobro') return direction === 'asc' ? va - vb : vb - va;
      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSortReparacion = (field) => {
    setSortReparacion((prev) => ({
      field,
      direction: prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : (field === 'fecha' ? 'desc' : 'asc'),
    }));
  };

  const ordenarUsuarios = (items, field, direction) => {
    const getValue = (item, f) => {
      if (f === 'username') return item.username?.toLowerCase() || '';
      if (f === 'rol') return item.rol?.toLowerCase() || '';
      return '';
    };
    return [...items].sort((a, b) => {
      let va = getValue(a, field);
      let vb = getValue(b, field);
      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSortUsuario = (field) => {
    setSortUsuario((prev) => ({
      field,
      direction: prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc',
    }));
  };

  const getFiltradosTickets = () => {
    if (!Array.isArray(ticketsList)) return [];
    let filtrados = ticketsList.filter(
      (t) =>
        t.nombres?.toLowerCase().includes(filtroTickets) ||
        t.apellidos?.toLowerCase().includes(filtroTickets) ||
        t.producto?.toLowerCase().includes(filtroTickets) ||
        t.id.toString().includes(filtroTickets) ||
        t.categoria?.toLowerCase().includes(filtroTickets) ||
        getEstadoTexto(t).toLowerCase().includes(filtroTickets) ||
        getCobroInfo(t.id).texto.toLowerCase().includes(filtroTickets)
    );
    return ordenarTickets(filtrados, sortTicket.field, sortTicket.direction);
  };

  // ===== MODALES Y ACCIONES =====
  const abrirEditarTicket = (ticket) => {
    setEditingTicket(ticket);
    const abierto = ticket.estado !== 'cerrado';
    setEstadoAbierto(abierto);
    const visual = ticket.estado_visual || 'revision';
    setNuevoEstadoVisual(visual);
    setComentarioTicket(ticket.comentarioSupervisor || '');
    setModalTicketOpen(true);
  };

  const guardarEdicionTicket = async () => {
    if (!editingTicket) return;
    setCargando(true);
    try {
      const payload = {
        comentarioSupervisor: comentarioTicket,
      };

      if (estadoAbierto) {
        const mapeo = {
          baja: { estadoInterno: 'abierto', prioridad: 'baja' },
          media: { estadoInterno: 'abierto', prioridad: 'media' },
          urgente: { estadoInterno: 'abierto', prioridad: 'alta' },
          revision: { estadoInterno: 'progreso', prioridad: 'media' },
          resuelto: { estadoInterno: 'resuelto', prioridad: 'media' },
        };
        const mapeado = mapeo[nuevoEstadoVisual] || { estadoInterno: 'abierto', prioridad: 'media' };
        payload.estado = mapeado.estadoInterno;
        payload.prioridad = mapeado.prioridad;
        payload.estado_visual = nuevoEstadoVisual;
      } else {
        payload.estado = 'cerrado';
      }

      await tickets.patch(editingTicket.id, payload);
      await cargarDatos();
      setModalTicketOpen(false);
      setEditingTicket(null);
      alert('Ticket actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar ticket:', error);
      alert('Error al actualizar el ticket. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  // ===== LÓGICA DE USUARIOS =====
  const abrirModalUsuario = () => {
    setFormUsuario({ usuario: '', password: '', rol: 'vendedor' });
    setModalUsuarioOpen(true);
  };

  const guardarUsuario = async () => {
    if (!formUsuario.usuario || !formUsuario.password || !formUsuario.rol) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    if (cargandoUsuario) return;
    setCargandoUsuario(true);
    try {
      await registrarUsuario({
        username: formUsuario.usuario,
        password: formUsuario.password,
        rol: formUsuario.rol,
      });
      alert('Usuario creado exitosamente.');
      setModalUsuarioOpen(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert('Error al crear usuario: ' + (error.message || 'Error desconocido'));
    } finally {
      setCargandoUsuario(false);
    }
  };

  const eliminarUsuario = async (username) => {
    if (username === 'admin@tienda.cl') {
      alert('No se puede eliminar al administrador principal.');
      return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${username}"?`)) return;
    if (cargandoUsuario) return;
    setCargandoUsuario(true);
    try {
      const users = await usuarios.getAll();
      const user = users.find((u) => u.username === username);
      if (!user) throw new Error(`El usuario "${username}" no existe.`);
      await usuarios.delete(user.id);
      alert('Usuario eliminado.');
      await cargarDatos();
    } catch (error) {
      console.error('Error en eliminarUsuario:', error);
      alert(`No se pudo eliminar el usuario: ${error.message || 'Error desconocido'}`);
    } finally {
      setCargandoUsuario(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_actual');
    navigate('/login');
  };

  const getSortIcon = (field, currentSort) =>
    currentSort.field === field ? (currentSort.direction === 'asc' ? '↑' : '↓') : '↕️';

  // ===== DATOS PROCESADOS =====
  const ticketsFiltrados = getFiltradosTickets();
  const reparacionesOrdenadas = ordenarReparaciones(dashboard.ultimasReparaciones, sortReparacion.field, sortReparacion.direction);
  const usuariosOrdenados = ordenarUsuarios(usuariosList, sortUsuario.field, sortUsuario.direction);

  // ===== EXPOSICIÓN =====
  return {
    usuarioActual,
    activeTab,
    setActiveTab,
    ticketsFiltrados,
    reparacionesOrdenadas,
    usuariosOrdenados,
    dashboard,
    materiales: materialesList,
    editingTicket,
    modalTicketOpen,
    estadoAbierto,
    setEstadoAbierto,
    nuevoEstadoVisual,
    setNuevoEstadoVisual,
    comentarioTicket,
    setComentarioTicket,
    setModalTicketOpen,
    modalUsuarioOpen,
    formUsuario,
    setFormUsuario,
    setModalUsuarioOpen,
    getEstadoTexto,
    getEstadoClase,
    abrirEditarTicket,
    guardarEdicionTicket,
    abrirModalUsuario,
    guardarUsuario,
    eliminarUsuario,
    cerrarSesion,
    handleSortTicket,
    handleSortReparacion,
    handleSortUsuario,
    getSortIcon,
    sortTicket,
    sortReparacion,
    sortUsuario,
    filtroTickets,
    setFiltroTickets,
    cargandoUsuario,
    cargando,
    cargarDatos,
  };
};