// src/jsx/useContacto.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const useContacto = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const timeoutRef = useRef(null); // Referencia para el timeout

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (mensaje.texto) setMensaje({ texto: '', tipo: '' });
  };

  const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombre, email, asunto, mensaje: msg } = formData;
    if (!nombre || !email || !asunto || !msg) {
      setMensaje({ texto: '❌ Por favor completa todos los campos.', tipo: 'error' });
      return;
    }
    if (!validarEmail(email)) {
      setMensaje({ texto: '❌ El correo electrónico no es válido.', tipo: 'error' });
      return;
    }

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setMensaje({ texto: '✅ ¡Mensaje enviado con éxito! Te contactaremos pronto.', tipo: 'exito' });
    setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
    
    // Guardar referencia al timeout
    timeoutRef.current = setTimeout(() => {
      setMensaje({ texto: '', tipo: '' });
      timeoutRef.current = null;
    }, 5000);
  };

  const handleVolver = () => {
    navigate('/');
  };

  return {
    formData,
    mensaje,
    handleChange,
    handleSubmit,
    handleVolver
  };
};