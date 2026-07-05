// src/jsx/useLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getPerfil } from '../services/api';

export const useLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { usuario, password } = formData;

    if (!usuario || !password) {
      setError('❌ Por favor ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Obtener token JWT usando el servicio centralizado
      const tokenData = await login(usuario, password);
      const accessToken = tokenData.access;

      // 2. Guardar tokens en localStorage (necesario para que getPerfil funcione)
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', tokenData.refresh);

      // 3. Obtener perfil del usuario autenticado (usa el token recién guardado)
      const perfilData = await getPerfil();

      // 4. Guardar datos de sesión
      localStorage.setItem('usuario_actual', JSON.stringify({
        usuario: perfilData.user.username,
        rol: perfilData.rol,
        loginTime: new Date().toISOString()
      }));

      // 5. Redirigir según el rol
      const rol = perfilData.rol;
      let destino = '/';
      switch (rol) {
        case 'administrador': destino = '/admin'; break;
        case 'supervisor': destino = '/supervisor'; break;
        case 'vendedor': destino = '/vendedor'; break;
        case 'tecnico': destino = '/tecnico'; break;
        case 'gerente': destino = '/gerente'; break;
        default: destino = '/';
      }
      navigate(destino);

    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    error,
    loading,
    handleChange,
    handleSubmit
  };
};