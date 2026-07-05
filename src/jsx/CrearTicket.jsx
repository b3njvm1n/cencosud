// src/jsx/useCrearTicket.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tickets } from '../services/api/crearticket';

// Subcategorías por categoría
const productosPorCategoria = {
  iluminacion: ["Falla en un foco", "Corto circuito de foco"],
  climatizacion: [
    "Falla en el aire acondicionado general",
    "Falla en el aire acondicionado de carne",
    "Falla en los controles remotos del aire",
  ],
  escaleras_mecanicas: [
    "Interferencia de la escalera mecánica",
    "No sube o no baja la escalera",
  ],
  enchufes: [
    "Enchufes sueltos",
    "Enchufe con problemas eléctricos",
    "Enchufe sin corriente",
  ],
  puertas: [
    "Suenan las puertas",
    "Problemas con las manillas",
    "Problemas con el seguro",
  ],
  ascensores: [
    "No suben o no bajan los ascensores",
    "No abre la puerta",
    "Problemas con las luces",
  ],
};

// Validación de formato de RUT
const validarRutFormato = (rut) => {
  if (!rut) return false;
  let valor = rut.replace(/\./g, '').replace(/\s/g, '');
  if (!valor.includes('-')) return false;
  const partes = valor.split('-');
  if (partes.length !== 2) return false;
  const cuerpo = partes[0];
  const dv = partes[1];
  if (!/^\d+$/.test(cuerpo)) return false;
  if (!/^[0-9Kk]$/.test(dv)) return false;
  return true;
};

// Función para generar boleta aleatoria de 14 dígitos
const generarBoleta = () => {
  let boleta = '';
  for (let i = 0; i < 14; i++) {
    boleta += Math.floor(Math.random() * 10);
  }
  return boleta;
};

export const useCrearTicket = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    nacionalidad: '',
    sexo: '',
    documento: '',
    boleta: '',
    categoria: '',
    producto: '',
    explicacion: '',
  });
  const [evidenciaFile, setEvidenciaFile] = useState(null);
  const [evidenciaBase64, setEvidenciaBase64] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '', datosTicket: null });
  const [productoOptions, setProductoOptions] = useState([]);
  const [productoEsInput, setProductoEsInput] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCategoriaChange = (e) => {
    const categoria = e.target.value;
    setFormData((prev) => ({ ...prev, categoria, producto: '' }));
    const productos = productosPorCategoria[categoria] || [];
    if (categoria !== "" && productos.length > 0) {
      setProductoOptions(productos);
      setProductoEsInput(false);
    } else if (categoria !== "") {
      setProductoOptions([]);
      setProductoEsInput(true);
    } else {
      setProductoOptions([]);
      setProductoEsInput(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setEvidenciaFile(null);
      setEvidenciaBase64(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMensaje({
        texto: "⚠️ El archivo es demasiado grande (máx. 10MB). No se adjuntará.",
        tipo: "error",
        datosTicket: null
      });
      setEvidenciaFile(null);
      setEvidenciaBase64(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidenciaBase64(reader.result);
      setEvidenciaFile(file);
      if (mensaje.tipo === 'error') {
        setMensaje({ texto: '', tipo: '', datosTicket: null });
      }
    };
    reader.onerror = () => {
      setMensaje({
        texto: "❌ Error al leer el archivo. Intenta nuevamente.",
        tipo: "error",
        datosTicket: null
      });
      setEvidenciaFile(null);
      setEvidenciaBase64(null);
    };
    reader.readAsDataURL(file);
  };

  // ===== GUARDAR TICKET CON ID GENERADO POR EL FRONTEND =====
  const guardarTicket = async () => {
    const { nombres, apellidos, nacionalidad, sexo, documento, boleta, categoria, producto, explicacion } = formData;

    // Prioridad según categoría
    let prioridad = "baja";
    if (categoria === "escaleras_mecanicas" || categoria === "ascensores") {
      prioridad = "media";
    }

    const categoriaTexto = document.querySelector(`#categoria option[value="${categoria}"]`)?.text || categoria;

    const rutLimpio = documento.replace(/\./g, "").replace(/\s/g, "").toUpperCase();
    const [cuerpoRut, dvRut] = rutLimpio.split('-');
    const rutNormalizado = `${cuerpoRut}-${dvRut}`;

    let numeroBoleta = boleta.trim();
    if (!numeroBoleta) {
      numeroBoleta = generarBoleta();
    }

    // 🔹 Generar ID del ticket (RUT-001, RUT-002, ...)
    let correlativo = '001';
    try {
      const allTickets = await tickets.getAll();
      const reclamosUsuario = allTickets.filter(
        (t) => t.documento && t.documento.replace(/\./g, "").replace(/\s/g, "").toUpperCase() === rutNormalizado
      );
      correlativo = String(reclamosUsuario.length + 1).padStart(3, "0");
    } catch (error) {
      console.warn('No se pudo obtener la lista de tickets, usando correlativo 001');
    }
    const ticketId = `${rutNormalizado}-${correlativo}`;

    // 🔹 Payload incluyendo el ID generado
    const payload = {
      id: ticketId,
      nombres,
      apellidos,
      nacionalidad,
      sexo,
      documento: rutNormalizado,
      boleta: numeroBoleta,
      categoria,
      categoriaTexto,
      producto,
      explicacion,
      evidenciaNombre: evidenciaFile ? evidenciaFile.name : null,
      evidenciaTipo: evidenciaFile ? evidenciaFile.type : null,
      evidenciaBase64: evidenciaBase64,
      estado: "progreso",
      prioridad: prioridad,
      estado_visual: "revision",
      comentarioSupervisor: "",
    };

    setCargando(true);

    try {
      const response = await tickets.create(payload);
      console.log('Ticket creado en backend:', response);

      const datosTicket = {
        id: response.id,
        numeroBoleta: response.boleta || numeroBoleta,
        fecha: new Date(response.fecha).toLocaleString(),
        cliente: `${response.nombres} ${response.apellidos}`,
        documento: response.documento,
        categoria: response.categoriaTexto || response.categoria,
        producto: response.producto,
        explicacion: response.explicacion,
      };

      setMensaje({
        texto: "✅ Reclamo enviado correctamente. A continuación los detalles:",
        tipo: "exito",
        datosTicket
      });

      // Limpiar formulario
      setFormData({
        nombres: "",
        apellidos: "",
        nacionalidad: "",
        sexo: "",
        documento: "",
        boleta: "",
        categoria: "",
        producto: "",
        explicacion: "",
      });
      setEvidenciaFile(null);
      setEvidenciaBase64(null);
      setProductoOptions([]);
      setProductoEsInput(false);
    } catch (error) {
      console.error('Error al crear ticket:', error);
      setMensaje({
        texto: `❌ Error al guardar el reclamo: ${error.message}`,
        tipo: "error",
        datosTicket: null
      });
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombres, apellidos, nacionalidad, sexo, documento, categoria, producto, explicacion } = formData;

    if (!nombres || !apellidos || !nacionalidad || !sexo || !documento || !categoria || !producto || !explicacion) {
      setMensaje({ texto: "❌ Por favor completa todos los campos obligatorios.", tipo: "error", datosTicket: null });
      return;
    }

    if (!validarRutFormato(documento)) {
      setMensaje({
        texto: "❌ RUT o pasaporte inválido. Debe tener el formato 12.345.678-9 (con guión y dígito verificador).",
        tipo: "error",
        datosTicket: null
      });
      return;
    }

    guardarTicket();
  };

  const goHome = () => {
    navigate('/');
  };

  const isProductoDisabled = !formData.categoria;

  useEffect(() => {
    if (mensaje.texto && !mensaje.datosTicket) {
      const timer = setTimeout(() => setMensaje({ texto: '', tipo: '', datosTicket: null }), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  return {
    formData,
    mensaje,
    productoOptions,
    productoEsInput,
    handleChange,
    handleCategoriaChange,
    handleFileChange,
    handleSubmit,
    isProductoDisabled,
    goHome,
    cargando,
  };
};