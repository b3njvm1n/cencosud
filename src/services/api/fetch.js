// src/services/apis/fetch.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('usuario_actual');
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Solo agregar token si la opción authenticated es true
  if (options.authenticated) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  console.log(`[apiFetch] ${options.method || 'GET'} ${url}`, options.authenticated ? '(autenticado)' : '(público)');

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`[apiFetch] Respuesta ${response.status}:`, responseData);

    if (!response.ok) {
      let errorMessage;
      if (typeof responseData === 'object' && responseData !== null) {
        errorMessage = responseData.detail || responseData.message || JSON.stringify(responseData);
      } else {
        errorMessage = responseData || 'Error en la petición';
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = response;
      error.data = responseData;
      throw error;
    }

    return responseData;
  } catch (error) {
    if (error.response) {
      console.error(`[apiFetch] Error ${error.status}:`, error.message);
      throw error;
    }
    console.error('[apiFetch] Error de red o inesperado:', error);
    throw new Error('Error de conexión con el servidor.');
  }
};

export const refreshToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    console.warn('[refreshToken] No hay refresh token');
    throw new Error('No hay refresh token');
  }
  console.log('[refreshToken] Intentando refrescar token...');
  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      console.error('[refreshToken] Falló el refresh, status:', response.status);
      clearTokens();
      throw new Error('Sesión expirada. Inicia sesión nuevamente.');
    }
    const data = await response.json();
    setTokens(data.access, refresh);
    console.log('[refreshToken] Token refrescado exitosamente.');
    return data.access;
  } catch (error) {
    console.error('[refreshToken] Error:', error);
    clearTokens();
    throw error;
  }
};

export const apiFetchWithRefresh = async (endpoint, options = {}) => {
  const authOptions = { ...options, authenticated: true };
  try {
    return await apiFetch(endpoint, authOptions);
  } catch (error) {
    if (error.status === 401 || error.message.includes('no está autenticado')) {
      console.warn('[apiFetchWithRefresh] Error 401, intentando refresh...');
      try {
        await refreshToken();
        return await apiFetch(endpoint, authOptions);
      } catch (refreshError) {
        console.error('[apiFetchWithRefresh] Refresh falló, redirigiendo al login.');
        clearTokens();
        window.location.href = '/login';
        throw refreshError;
      }
    }
    throw error;
  }
};