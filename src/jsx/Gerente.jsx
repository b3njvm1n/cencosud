// src/jsx/useGerente.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { tickets, ventas, atenciones, materiales } from '../services/api';

const COLORS = {
  orange: '#FF6B35',
  green: '#4CAF50',
  yellow: '#FFC107',
  red: '#E53935',
  purple: '#8E24AA',
  cyan: '#29B6F6',
  white: '#FFFFFF',
  lightGray: '#E0E7F0',
  transparentWhite: 'rgba(255,255,255,0.1)',
  blue: '#4285F4',
};

export const useGerente = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    ingresosTotales: 0,
    totalTickets: 0,
    resueltos: 0,
    gastadoTotal: 0,
    stockNuevo: 0,
    ventasTotales: 0,
    reparacionesTotales: 0,
  });
  const [ranking, setRanking] = useState([]);
  const [productosReparados, setProductosReparados] = useState({});
  const [evolucionData, setEvolucionData] = useState({ fechas: [], montos: [] });

  const charts = useRef({});
  const evolucionRef = useRef(null);
  const categoriasRef = useRef(null);
  const prioridadesRef = useRef(null);
  const estadosRef = useRef(null);
  const productosRef = useRef(null);

  // ===== AUTENTICACIÓN =====
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario_actual') || 'null');
    if (!user || user.rol !== 'gerente') {
      alert('Acceso denegado. Solo gerentes.');
      navigate('/login');
    } else {
      cargarDatos();
    }
  }, [navigate]);

  // ===== CARGAR DATOS DESDE LA API =====
  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      console.log('[useGerente] 🔄 Cargando datos desde la API...');

      const [ticketsData, ventasData, atencionesData, materialesData] = await Promise.all([
        tickets.getAll().catch(err => {
          console.warn('[useGerente] ⚠️ Error al cargar tickets:', err);
          return [];
        }),
        ventas.getAll().catch(err => {
          console.warn('[useGerente] ⚠️ Error al cargar ventas:', err);
          return [];
        }),
        atenciones.getAll().catch(err => {
          console.warn('[useGerente] ⚠️ Error al cargar atenciones:', err);
          return [];
        }),
        materiales.getAll().catch(err => {
          console.warn('[useGerente] ⚠️ Error al cargar materiales:', err);
          return [];
        }),
      ]);

      console.log('[useGerente] 📦 Tickets:', ticketsData?.length);
      console.log('[useGerente] 📦 Ventas:', ventasData?.length);
      console.log('[useGerente] 📦 Atenciones:', atencionesData?.length);
      console.log('[useGerente] 📦 Materiales:', materialesData?.length);

      const ticketsArray = Array.isArray(ticketsData) ? ticketsData : [];
      const ventasArray = Array.isArray(ventasData) ? ventasData : [];
      const atencionesArray = Array.isArray(atencionesData) ? atencionesData : [];
      const materialesArray = Array.isArray(materialesData) ? materialesData : [];

      // Calcular estadísticas
      const totalVentas = ventasArray.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
      const totalReparaciones = atencionesArray.reduce((sum, a) => sum + (Number(a.montoCobro) || 0), 0);
      const resueltos = ticketsArray.filter(t => t.estado === 'resuelto' || t.estado_visual === 'resuelto').length;
      const gastadoTotal = materialesArray.reduce((sum, m) => sum + (Number(m.cantidad) * Number(m.costoUnitario) || 0), 0);
      const stockNuevo = materialesArray.length;

      setStats({
        ingresosTotales: totalVentas + totalReparaciones,
        totalTickets: ticketsArray.length,
        resueltos,
        gastadoTotal,
        stockNuevo,
        ventasTotales: totalVentas,
        reparacionesTotales: totalReparaciones,
      });

      // Ranking de vendedores por monto cobrado
      const rankingMap = {};
      atencionesArray.forEach(a => {
        if (!a.montoCobro || Number(a.montoCobro) <= 0) return;
        const vendedor = a.vendedor || 'Sin nombre';
        if (!rankingMap[vendedor]) rankingMap[vendedor] = { cantidad: 0, monto: 0 };
        rankingMap[vendedor].cantidad++;
        rankingMap[vendedor].monto += Number(a.montoCobro);
      });
      const rankingArray = Object.entries(rankingMap).map(([nombre, datos]) => ({ nombre, ...datos }));
      rankingArray.sort((a, b) => b.monto - a.monto);
      setRanking(rankingArray);

      // Productos más reparados
      const productos = {};
      ticketsArray.forEach(t => {
        const prod = t.producto || 'Sin producto';
        productos[prod] = (productos[prod] || 0) + 1;
      });
      setProductosReparados(productos);

      // Evolución de reparaciones por fecha
      const reparacionesPorFecha = {};
      atencionesArray.forEach(a => {
        if (!a.montoCobro || Number(a.montoCobro) <= 0) return;
        const fecha = new Date(a.fecha).toLocaleDateString('es-CL');
        reparacionesPorFecha[fecha] = (reparacionesPorFecha[fecha] || 0) + Number(a.montoCobro);
      });
      const fechas = Object.keys(reparacionesPorFecha).sort((a, b) => new Date(a) - new Date(b));
      const montos = fechas.map(f => reparacionesPorFecha[f]);
      setEvolucionData({ fechas, montos });

      // Renderizar gráficos después de que el DOM esté listo
      setTimeout(() => {
        renderGraficoEvolucion(fechas, montos);
        renderGraficoCategorias(ticketsArray);
        renderGraficoPrioridades(ticketsArray);
        renderGraficoEstados(ticketsArray);
        renderGraficoProductos(productos);
      }, 200);

      console.log('[useGerente] ✅ Datos cargados correctamente.');
    } catch (err) {
      console.error('[useGerente] ❌ Error inesperado:', err);
      setError('No se pudieron cargar los datos. Verifica tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  // ===== FUNCIONES DE GRÁFICOS =====
  const renderGraficoEvolucion = (fechas, montos) => {
    if (!evolucionRef.current) return;
    if (charts.current.evolucion) charts.current.evolucion.destroy();
    charts.current.evolucion = new Chart(evolucionRef.current, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [{
          label: 'Reparaciones ($)',
          data: montos,
          borderColor: COLORS.orange,
          backgroundColor: `${COLORS.orange}33`,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: COLORS.orange,
          pointBorderColor: COLORS.white,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: COLORS.white, font: { weight: 'bold' } } },
          tooltip: { callbacks: { label: (ctx) => `$${ctx.raw.toLocaleString()}` } }
        },
        scales: {
          x: { ticks: { color: COLORS.lightGray }, grid: { color: COLORS.transparentWhite } },
          y: { ticks: { color: COLORS.lightGray }, grid: { color: COLORS.transparentWhite } }
        }
      }
    });
  };

  const renderGraficoCategorias = (tickets) => {
    if (!categoriasRef.current) return;
    if (charts.current.categorias) charts.current.categorias.destroy();
    const categorias = {};
    tickets.forEach(t => {
      const cat = t.categoriaTexto || t.categoria || 'Sin categoría';
      categorias[cat] = (categorias[cat] || 0) + 1;
    });
    const labels = Object.keys(categorias);
    const data = Object.values(categorias);
    const backgroundColors = labels.map((_, i) => {
      const colors = [COLORS.orange, COLORS.green, COLORS.yellow, COLORS.red, COLORS.purple, COLORS.cyan];
      return colors[i % colors.length];
    });
    charts.current.categorias = new Chart(categoriasRef.current, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: backgroundColors, borderColor: COLORS.white, borderWidth: 2 }] },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: COLORS.white, font: { weight: 'bold' } } } }
      }
    });
  };

  const renderGraficoPrioridades = (tickets) => {
    if (!prioridadesRef.current) return;
    if (charts.current.prioridades) charts.current.prioridades.destroy();
    const prioridades = {};
    tickets.forEach(t => {
      const prioridad = t.prioridad || (t.estado_visual === 'urgente' ? 'alta' : 'media');
      prioridades[prioridad] = (prioridades[prioridad] || 0) + 1;
    });
    const labels = Object.keys(prioridades);
    const data = Object.values(prioridades);
    const colorMap = { 'baja': COLORS.green, 'media': COLORS.yellow, 'alta': COLORS.red };
    const backgroundColors = labels.map(label => colorMap[label] || COLORS.orange);
    charts.current.prioridades = new Chart(prioridadesRef.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: backgroundColors, borderColor: COLORS.white, borderWidth: 2 }] },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: COLORS.white, font: { weight: 'bold' } } } }
      }
    });
  };

  // ===== GRÁFICO DE RECLAMOS POR ESTADO VISUAL =====
  const renderGraficoEstados = (tickets) => {
    if (!estadosRef.current) return;
    if (charts.current.estados) charts.current.estados.destroy();

    // Función auxiliar para obtener estado_visual (igual que en los otros hooks)
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

    // Mapeo de valores visuales a etiquetas legibles
    const mapeoTexto = {
      baja: 'Prioridad baja',
      media: 'Prioridad media',
      urgente: 'Prioridad alta',
      revision: 'Revisión',
      resuelto: 'Resuelto',
    };

    // Mapeo de colores
    const mapeoColor = {
      baja: COLORS.green,
      media: COLORS.yellow,
      urgente: COLORS.red,
      revision: COLORS.orange,
      resuelto: COLORS.blue,
    };

    // Orden deseado en el gráfico
    const ordenEstados = ['baja', 'media', 'urgente', 'revision', 'resuelto'];

    // Contar tickets por estado visual
    const conteo = {};
    tickets.forEach(t => {
      const visual = getEstadoVisual(t);
      conteo[visual] = (conteo[visual] || 0) + 1;
    });

    // Preparar datos en el orden deseado
    const labels = ordenEstados.map(key => mapeoTexto[key] || key);
    const data = ordenEstados.map(key => conteo[key] || 0);
    const colors = ordenEstados.map(key => mapeoColor[key] || COLORS.orange);

    charts.current.estados = new Chart(estadosRef.current, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad de tickets',
          data: data,
          backgroundColor: colors,
          borderRadius: 8,
          borderColor: COLORS.white,
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.raw} tickets` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: COLORS.transparentWhite },
            ticks: { color: COLORS.lightGray, stepSize: 1 }
          },
          x: {
            ticks: { color: COLORS.lightGray },
            grid: { display: false }
          }
        }
      }
    });
  };

  const renderGraficoProductos = (productos) => {
    if (!productosRef.current) return;
    if (charts.current.productos) charts.current.productos.destroy();
    const labels = Object.keys(productos).slice(0, 8);
    const data = labels.map(l => productos[l]);
    charts.current.productos = new Chart(productosRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Cantidad de reparaciones', data, backgroundColor: COLORS.green, borderRadius: 8, borderColor: COLORS.white, borderWidth: 1 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        scales: {
          x: { beginAtZero: true, grid: { color: COLORS.transparentWhite }, ticks: { color: COLORS.lightGray } },
          y: { ticks: { color: COLORS.lightGray }, grid: { color: COLORS.transparentWhite } }
        },
        plugins: { legend: { labels: { color: COLORS.white, font: { weight: 'bold' } } } }
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario_actual');
    navigate('/login');
  };

  return {
    stats,
    ranking,
    evolucionData,
    evolucionRef,
    categoriasRef,
    prioridadesRef,
    estadosRef,
    productosRef,
    handleLogout,
    cargando,
    error,
    recargar: cargarDatos,
  };
};