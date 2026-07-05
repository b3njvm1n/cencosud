// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './page/HomePage';
import CrearTicket from './page/CrearTicket';
import EstadoTicket from './page/EstadoTicket';
import Contacto from './page/Contacto';
import Login from './page/Login';
import Admin from './page/Admin';
import Supervisor from './page/Supervisor';
import Vendedor from './page/Vendedor';
import Tecnico from './page/Tecnico';
import Gerente from './page/Gerente';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/crear-ticket" element={<CrearTicket />} />
      <Route path="/estado-ticket" element={<EstadoTicket />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/supervisor" element={<Supervisor />} />
      <Route path="/vendedor" element={<Vendedor />} />
      <Route path="/tecnico" element={<Tecnico />} />
      <Route path="/gerente" element={<Gerente />} />
    </Routes>
  );
}

export default App;