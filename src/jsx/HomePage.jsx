// src/jsx/useHomePage.jsx
import { useMemo } from 'react';

export const useHomePage = () => {
  // Configuración de textos y enlaces
  const config = useMemo(() => ({
    welcomeTitle: 'Bienvenido a la zona de tickets',
    welcomeMessage: 'Reporta fallas de tus productos o servicios. Tu reporte ayuda a mejorar la experiencia de todos.',
    buttonLogin: {
      text: 'Iniciar sesión',
      link: '/login',
      icon: 'fas fa-sign-in-alt'
    },
    buttonCreate: {
      text: 'Crear nuevo ticket',
      link: '/crear-ticket',
      icon: 'fas fa-plus-circle'
    },
    footerLinks: [
      { text: 'Ver su estado', link: '/estado-ticket' },
      { text: 'Contáctanos', link: '/contacto' }
    ]
  }), []);

  // Función para manejar clics (ej. analytics, logs)
  const trackClick = (linkName) => {
    console.log(`[HomePage] Navegando a: ${linkName}`);
    // Aquí se puede agregar llamada a API o Google Analytics
  };

  return { config, trackClick };
};