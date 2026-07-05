// src/page/HomePage.jsx
// ============================================================
// PÁGINA DE INICIO (HomePage)
// Componente que renderiza la página de aterrizaje pública de la aplicación.
// Muestra un mensaje de bienvenida, opciones para crear un reclamo,
// consultar estado y un botón de inicio de sesión para usuarios internos.
// ============================================================

// Importación de react-router-dom para manejar la navegación entre páginas
import { Link } from 'react-router-dom';

// Hook personalizado que contiene la lógica de negocio y configuración de la página
import { useHomePage } from '../jsx/HomePage';

// Estilos específicos de la página de inicio (SCSS)
import '../scss/HomePage.scss';

// Logos: el primero para TicketZone, el segundo para el cliente (Cencosud)
import logo from '../assets/logo.svg'; // logo de TicketZone
import cencosudLogo from '../assets/logo.svg'; // logo de Cencosud

// ============================================================
// COMPONENTE PRINCIPAL: HomePage
// ============================================================
const HomePage = () => {
  // Extrae la configuración y la función de tracking del hook personalizado
  // config: contiene textos, enlaces e iconos para los botones y mensajes
  // trackClick: función para registrar análisis de clics (ej. Google Analytics)
  const { config, trackClick } = useHomePage();

  // Manejador de navegación: al hacer clic en cualquier enlace, registra el evento
  // y permite realizar acciones adicionales (logs, analytics, etc.)
  const handleNavigation = (linkName) => {
    trackClick(linkName);
  };

  // ============================================================
  // RENDERIZADO DE LA PÁGINA
  // ============================================================
  return (
    // Contenedor principal de la página (clase CSS para estilos globales)
    <div className="homepage">

      {/* ===== HEADER FIJO (barra de navegación superior) ===== */}
      <header className="homepage-header">
        {/* Área del logo: imagen y nombre de la aplicación */}
        <div className="logo-area">
          <img src={logo} alt="Logo TicketZone" className="logo-img" />
          <span>TicketZone</span>
        </div>

        {/* Barra de navegación con enlaces principales y botón de login */}
        <nav className="header-nav">
          {/* Enlace a la página de inicio (home) */}
          <Link to="/">Home</Link>
          {/* Enlace a la página de consulta de estado de ticket */}
          <Link to="/estado-ticket">Estado</Link>
          {/* Enlace a la página de contacto (aún no implementada) */}
          <Link to="/contacto">Contacto</Link>

          {/* Botón de inicio de sesión: usa la configuración del hook para obtener el enlace, texto e icono */}
          <Link
            to={config.buttonLogin.link}
            className="btn-login"
            onClick={() => handleNavigation(config.buttonLogin.text)}
          >
            <i className={config.buttonLogin.icon}></i> {config.buttonLogin.text}
          </Link>
        </nav>
      </header>

      {/* ===== CONTENIDO CENTRAL (principal de la página) ===== */}
      <main className="homepage-content">
        {/* Contenedor de la tarjeta de bienvenida (centrado vertical/horizontalmente) */}
        <div className="welcome-container">
          <div className="welcome-card">

            {/* Logo de la empresa cliente (Cencosud) */}
            <div className="cencosud-logo">
              <img src={cencosudLogo} alt="Cencosud" />
            </div>

            {/* Icono decorativo de la página (lista de verificación) */}
            <div className="welcome-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>

            {/* Título de bienvenida: se obtiene de la configuración */}
            <h1>{config.welcomeTitle}</h1>

            {/* Mensaje de bienvenida: descripción breve del propósito */}
            <p className="welcome-message">{config.welcomeMessage}</p>

            {/* Botón principal: "Crear reclamo" – acción principal para los clientes */}
            <Link
              to={config.buttonCreate.link}
              className="btn-principal"
              onClick={() => handleNavigation(config.buttonCreate.text)}
            >
              <i className={config.buttonCreate.icon}></i> {config.buttonCreate.text}
            </Link>

            {/* Pie de la tarjeta: enlaces secundarios para consultar estado o iniciar sesión */}
            <p className="welcome-footer">
              ¿Ya tienes un ticket?{' '}
              {config.footerLinks.map((link, idx) => (
                <span key={link.link}>
                  <Link to={link.link} onClick={() => handleNavigation(link.text)}>
                    {link.text}
                  </Link>
                  {/* Agrega un separador "|" entre los enlaces, excepto después del último */}
                  {idx < config.footerLinks.length - 1 && ' | '}
                </span>
              ))}
            </p>
          </div>
        </div>
      </main>

      {/* ===== FOOTER FIJO (pie de página) ===== */}
      <footer className="homepage-footer">
        {/* Información de copyright */}
        <span>&copy; 2026 TicketZone - Todos los derechos reservados</span>
        {/* Enlace de contacto en el pie de página */}
        <div className="footer-links">
          <a href="/contacto">Contacto</a>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;