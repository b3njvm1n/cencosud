// src/jsx/useSupervisor.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supervisor } from '../services/api/supervisor';
import { tickets } from '../services/api/tickets';

export const useSupervisor = () => {
  const navigate = useNavigate();
  const [activeSubtab, setActiveSubtab] = useState('tickets-lista');
  const [ticketsList, setTicketsList] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [informes, setInformes] = useState([]);
  const [filtroTickets, setFiltroTickets] = useState('');
  const [filtroAtenciones, setFiltroAtenciones] = useState('');
  const [filtroInformes, setFiltroInformes] = useState('');
  const [sortTicket, setSortTicket] = useState({ field: 'fecha', direction: 'desc' });
  const [sortAtencion, setSortAtencion] = useState({ field: 'fecha', direction: 'desc' });
  const [sortInforme, setSortInforme] = useState({ field: 'fecha', direction: 'desc' });
  const [editingTicket, setEditingTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Estados para el modal
  const [estadoAbierto, setEstadoAbierto] = useState(true); // true = abierto, false = cerrado
  const [nuevoEstadoVisual, setNuevoEstadoVisual] = useState('revision');
  const [comentario, setComentario] = useState('');

  // ===== STOCK DE MATERIALES =====
  const [materiales, setMateriales] = useState([]);
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    cantidad: 1,
    costoUnitario: 0,
  });
  const [materialEditando, setMaterialEditando] = useState(null);
  const [materialEditForm, setMaterialEditForm] = useState({
    nombre: '',
    cantidad: 0,
    costoUnitario: 0,
  });
  const [modalMaterialOpen, setModalMaterialOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // ===== AUTENTICACIÓN =====
  const usuarioActual = JSON.parse(localStorage.getItem('usuario_actual') || '{}');
  useEffect(() => {
    if (!usuarioActual.usuario || usuarioActual.rol !== 'supervisor') {
      alert('Acceso denegado. Solo supervisores.');
      navigate('/login');
    }
  }, [navigate, usuarioActual]);

  // ===== CARGA INICIAL DE DATOS =====
  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [ticketsData, atencionesData, informesData, materialesData] = await Promise.all([
        supervisor.getTickets(),
        supervisor.getAtenciones(),
        supervisor.getInformes(),
        supervisor.getMateriales(),
      ]);

      const materialesNormalizados = Array.isArray(materialesData)
        ? materialesData.map(m => ({
            ...m,
            cantidad: Number(m.cantidad) || 0,
            costoUnitario: Number(m.costoUnitario) || 0,
          }))
        : [];

      setTicketsList(Array.isArray(ticketsData) ? ticketsData : []);
      setAtenciones(Array.isArray(atencionesData) ? atencionesData : []);
      setInformes(Array.isArray(informesData) ? informesData : []);
      setMateriales(materialesNormalizados);
    } catch (err) {
      console.error('Error cargando datos del supervisor:', err);
      setError('No se pudieron cargar los datos. Verifica tu conexión.');
      setTicketsList([]);
      setAtenciones([]);
      setInformes([]);
      setMateriales([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuarioActual.usuario && usuarioActual.rol === 'supervisor') {
      cargarDatos();
    }
  }, []);

  // ===== FUNCIONES AUXILIARES DE ESTADO DE TICKETS =====
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

  const getEstadoTexto = (ticket) => {
    if (!ticket) return 'Desconocido';
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
    if (!ticket) return '';
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
    if (!ticket) return 99;
    const order = { revision: 0, baja: 1, media: 2, urgente: 3, resuelto: 4 };
    return order[getEstadoVisual(ticket)] ?? 99;
  };

  // ===== ORDENAMIENTO Y FILTRADO =====
  const ordenarTickets = (items, field, direction) => {
    if (!Array.isArray(items)) return [];
    const getValue = (item, f) => {
      switch (f) {
        case 'id': return item.id;
        case 'fecha': return new Date(item.fecha);
        case 'cliente': return `${item.nombres} ${item.apellidos}`.toLowerCase();
        case 'categoria': return item.categoria?.toLowerCase() || '';
        case 'producto': return item.producto?.toLowerCase() || '';
        case 'estado': return getEstadoSortKey(item);
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

  const ordenarAtenciones = (items, field, direction) => {
    if (!Array.isArray(items)) return [];
    const getValue = (item, f) => {
      if (f === 'fecha') return new Date(item.fecha);
      if (f === 'vendedor') return item.vendedor?.toLowerCase() || '';
      if (f === 'cliente') return `${item.nombreCliente} ${item.apellidoCliente}`.toLowerCase();
      if (f === 'cobro') return item.montoCobro || 0;
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

  const ordenarInformes = (items, field, direction) => {
    if (!Array.isArray(items)) return [];
    const getValue = (item, f) => {
      if (f === 'fecha') return new Date(item.fecha);
      if (f === 'tecnico') return item.tecnico?.toLowerCase() || '';
      if (f === 'ticket') return item.ticket;
      if (f === 'cliente') return item.cliente?.toLowerCase() || '';
      if (f === 'correccion') return item.correccion?.toLowerCase() || '';
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

  const getFiltradosTickets = () => {
    if (!Array.isArray(ticketsList)) return [];
    let filtrados = ticketsList.filter((t) =>
      t.nombres?.toLowerCase().includes(filtroTickets) ||
      t.apellidos?.toLowerCase().includes(filtroTickets) ||
      t.producto?.toLowerCase().includes(filtroTickets) ||
      t.id.toString().includes(filtroTickets) ||
      t.categoria?.toLowerCase().includes(filtroTickets) ||
      getEstadoTexto(t).toLowerCase().includes(filtroTickets)
    );
    return ordenarTickets(filtrados, sortTicket.field, sortTicket.direction);
  };

  const getFiltradosAtenciones = () => {
    if (!Array.isArray(atenciones)) return [];
    let filtrados = atenciones.filter((a) =>
      `${a.nombreCliente} ${a.apellidoCliente}`.toLowerCase().includes(filtroAtenciones) ||
      a.vendedor?.toLowerCase().includes(filtroAtenciones) ||
      a.notas?.toLowerCase().includes(filtroAtenciones) ||
      (a.montoCobro
        ? `$${a.montoCobro.toLocaleString()} - ${a.detalleCobro || ''}`
        : 'Sin cobro'
      ).toLowerCase().includes(filtroAtenciones)
    );
    return ordenarAtenciones(filtrados, sortAtencion.field, sortAtencion.direction);
  };

  const getFiltradosInformes = () => {
    if (!Array.isArray(ticketsList) || !Array.isArray(informes)) return [];
    const ticketsMap = ticketsList.reduce((acc, t) => {
      acc[t.id] = `${t.nombres} ${t.apellidos}`;
      return acc;
    }, {});
    const combinados = informes.map((inf) => ({
      ...inf,
      cliente: ticketsMap[inf.ticket] || 'Cliente no encontrado',
    }));
    let filtrados = combinados.filter(
      (inf) =>
        inf.cliente.toLowerCase().includes(filtroInformes) ||
        inf.tecnico.toLowerCase().includes(filtroInformes) ||
        (inf.ticket && inf.ticket.toString().includes(filtroInformes)) ||
        inf.correccion.toLowerCase().includes(filtroInformes) ||
        inf.explicacion.toLowerCase().includes(filtroInformes)
    );
    return ordenarInformes(filtrados, sortInforme.field, sortInforme.direction);
  };

  // ===== FUNCIONES DE EDICIÓN DE TICKETS =====
  const abrirEditarTicket = (ticket) => {
    setEditingTicket(ticket);
    // Determinar si está abierto (no cerrado)
    const abierto = ticket.estado !== 'cerrado';
    setEstadoAbierto(abierto);
    // Cargar estado visual actual o 'revision' por defecto
    const visual = ticket.estado_visual || 'revision';
    setNuevoEstadoVisual(visual);
    setComentario(ticket.comentarioSupervisor || '');
    setModalOpen(true);
  };

  const guardarEdicionTicket = async () => {
    if (!editingTicket) return;
    setCargando(true);
    try {
      const payload = {
        comentarioSupervisor: comentario,
      };

      if (estadoAbierto) {
        // Mapeo de estado_visual a estado y prioridad
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
        // Si está cerrado, forzar estado='cerrado' y no modificar visual/prioridad
        payload.estado = 'cerrado';
        // No enviamos estado_visual ni prioridad para conservar los valores actuales
      }

      await tickets.patch(editingTicket.id, payload);
      await cargarDatos();
      setModalOpen(false);
      setEditingTicket(null);
      alert('Ticket actualizado correctamente.');
    } catch (err) {
      console.error('Error al actualizar ticket:', err);
      alert('Error al actualizar el ticket. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  // ===== FUNCIONES PARA MATERIALES =====
  const agregarMaterial = async () => {
    const { nombre, cantidad, costoUnitario } = nuevoMaterial;
    if (!nombre.trim() || cantidad <= 0 || costoUnitario <= 0) {
      alert('Por favor completa todos los campos con valores válidos.');
      return;
    }
    setCargando(true);
    try {
      console.log('[useSupervisor] Creando material:', { nombre, cantidad, costoUnitario });
      await supervisor.crearMaterial({
        nombre: nombre.trim(),
        cantidad: Number(cantidad),
        costoUnitario: Number(costoUnitario),
      });
      setNuevoMaterial({ nombre: '', cantidad: 1, costoUnitario: 0 });
      await cargarDatos();
      alert('Material agregado correctamente.');
    } catch (err) {
      console.error('Error al agregar material:', err);
      alert('Error al agregar material: ' + (err.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  const eliminarMaterial = async (id) => {
    if (!window.confirm('¿Eliminar este material?')) return;
    setCargando(true);
    try {
      console.log('[useSupervisor] Eliminando material ID:', id);
      await supervisor.eliminarMaterial(id);
      await cargarDatos();
      alert('Material eliminado.');
    } catch (err) {
      console.error('Error al eliminar material:', err);
      alert('Error al eliminar material: ' + (err.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  const abrirEditarMaterial = (material) => {
    setMaterialEditando(material);
    setMaterialEditForm({
      nombre: material.nombre,
      cantidad: Number(material.cantidad) || 0,
      costoUnitario: Number(material.costoUnitario) || 0,
    });
    setModalMaterialOpen(true);
  };

  const guardarEdicionMaterial = async () => {
    if (!materialEditando) return;
    const { nombre, cantidad, costoUnitario } = materialEditForm;
    if (!nombre.trim() || cantidad <= 0 || costoUnitario <= 0) {
      alert('Todos los campos son obligatorios y deben ser válidos.');
      return;
    }
    setCargando(true);
    try {
      console.log('[useSupervisor] Actualizando material:', materialEditando.id, materialEditForm);
      await supervisor.actualizarMaterial(materialEditando.id, {
        nombre: nombre.trim(),
        cantidad: Number(cantidad),
        costoUnitario: Number(costoUnitario),
      });
      await cargarDatos();
      setModalMaterialOpen(false);
      setMaterialEditando(null);
      alert('Material actualizado correctamente.');
    } catch (err) {
      console.error('Error al actualizar material:', err);
      alert('Error al actualizar material: ' + (err.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  const cerrarModalMaterial = () => {
    setModalMaterialOpen(false);
    setMaterialEditando(null);
  };

  const calcularTotal = () => {
    if (!Array.isArray(materiales)) return 0;
    return materiales.reduce((acc, m) => {
      const cantidad = Number(m.cantidad) || 0;
      const costo = Number(m.costoUnitario) || 0;
      return acc + cantidad * costo;
    }, 0);
  };

  // ===== HANDLERS DE ORDENAMIENTO =====
  const handleSortTicket = (field) => {
    setSortTicket((prev) => ({
      field,
      direction: prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc',
    }));
  };

  const handleSortAtencion = (field) => {
    setSortAtencion((prev) => ({
      field,
      direction: prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc',
    }));
  };

  const handleSortInforme = (field) => {
    setSortInforme((prev) => ({
      field,
      direction: prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc',
    }));
  };

  const getSortIcon = (field, currentSort) => {
    if (currentSort.field !== field) return '↕️';
    return currentSort.direction === 'asc' ? '↑' : '↓';
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_actual');
    navigate('/login');
  };

  return {
    usuarioActual,
    activeSubtab,
    setActiveSubtab,
    filtroTickets,
    setFiltroTickets,
    filtroAtenciones,
    setFiltroAtenciones,
    filtroInformes,
    setFiltroInformes,
    sortTicket,
    sortAtencion,
    sortInforme,
    editingTicket,
    modalOpen,
    estadoAbierto,
    setEstadoAbierto,
    nuevoEstadoVisual,
    setNuevoEstadoVisual,
    comentario,
    setComentario,
    setModalOpen,
    getFiltradosTickets,
    getFiltradosAtenciones,
    getFiltradosInformes,
    getEstadoTexto,
    getEstadoClase,
    abrirEditarTicket,
    guardarEdicionTicket,
    handleSortTicket,
    handleSortAtencion,
    handleSortInforme,
    getSortIcon,
    cerrarSesion,
    materiales,
    nuevoMaterial,
    setNuevoMaterial,
    agregarMaterial,
    eliminarMaterial,
    calcularTotal,
    materialEditando,
    materialEditForm,
    setMaterialEditForm,
    modalMaterialOpen,
    abrirEditarMaterial,
    guardarEdicionMaterial,
    cerrarModalMaterial,
    cargando,
    error,
  };
};