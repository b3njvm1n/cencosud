// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ===== TOKEN HELPERS =====
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

// ===== API FETCH BÁSICO (CON LOGS) =====
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`[apiFetch] ${options.method || 'GET'} ${url}`);

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

// ===== REFRESH TOKEN =====
export const refreshToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No hay refresh token');
  console.log('[refreshToken] Intentando refrescar token...');
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
};

// ===== API FETCH CON REFRESH AUTOMÁTICO =====
export const apiFetchWithRefresh = async (endpoint, options = {}) => {
  try {
    return await apiFetch(endpoint, options);
  } catch (error) {
    if (error.status === 401 || error.message.includes('no está autenticado')) {
      console.warn('[apiFetchWithRefresh] Error 401, intentando refresh...');
      try {
        await refreshToken();
        return await apiFetch(endpoint, options);
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

// ===== AUTENTICACIÓN =====
export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Error en el login');
  }
  return response.json();
};

export const getPerfil = async () => {
  return apiFetch('/perfiles/me/');
};

export const logout = () => {
  clearTokens();
  window.location.href = '/login';
};

// ===== REGISTRO DE USUARIOS (SOLO ADMIN) =====
export const registrarUsuario = async (data) => {
  return apiFetch('/registro-usuario/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// ===== ADMIN (DASHBOARD) =====
export const admin = {
  getDashboard: () => apiFetch('/admin/dashboard/'),
};

// ===== ENTIDADES CON REFRESH AUTOMÁTICO =====
export const tickets = {
  getAll: (params = '') => apiFetchWithRefresh(`/tickets/${params}`),
  get: (id) => apiFetchWithRefresh(`/tickets/${id}/`),
  create: (data) => apiFetchWithRefresh('/tickets/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/tickets/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/tickets/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/tickets/${id}/`, { method: 'DELETE' }),
  estadisticas: () => apiFetchWithRefresh('/tickets/estadisticas/'),
  cambiarEstado: (id, estado, comentarioSupervisor = '') => {
    const payload = { estado };
    if (comentarioSupervisor) payload.comentarioSupervisor = comentarioSupervisor;
    return apiFetchWithRefresh(`/tickets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

export const atenciones = {
  getAll: (params = '') => apiFetchWithRefresh(`/atenciones/${params}`),
  get: (id) => apiFetchWithRefresh(`/atenciones/${id}/`),
  create: (data) => apiFetchWithRefresh('/atenciones/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/atenciones/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/atenciones/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/atenciones/${id}/`, { method: 'DELETE' }),
};

export const informes = {
  getAll: (params = '') => apiFetchWithRefresh(`/informes/${params}`),
  get: (id) => apiFetchWithRefresh(`/informes/${id}/`),
  create: (data) => apiFetchWithRefresh('/informes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/informes/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/informes/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/informes/${id}/`, { method: 'DELETE' }),
};

export const materiales = {
  getAll: (params = '') => apiFetchWithRefresh(`/materiales/${params}`),
  get: (id) => apiFetchWithRefresh(`/materiales/${id}/`),
  create: (data) => apiFetchWithRefresh('/materiales/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/materiales/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/materiales/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/materiales/${id}/`, { method: 'DELETE' }),
};

export const usuarios = {
  getAll: (params = '') => apiFetchWithRefresh(`/usuarios/${params}`),
  get: (id) => apiFetchWithRefresh(`/usuarios/${id}/`),
  create: (data) => apiFetchWithRefresh('/usuarios/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/usuarios/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/usuarios/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/usuarios/${id}/`, { method: 'DELETE' }),
};

export const perfiles = {
  getAll: (params = '') => apiFetchWithRefresh(`/perfiles/${params}`),
  get: (id) => apiFetchWithRefresh(`/perfiles/${id}/`),
  me: () => apiFetchWithRefresh('/perfiles/me/'),
};

export const ventas = {
  getAll: (params = '') => apiFetchWithRefresh(`/ventas/${params}`),
  get: (id) => apiFetchWithRefresh(`/ventas/${id}/`),
  create: (data) => apiFetchWithRefresh('/ventas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/ventas/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/ventas/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/ventas/${id}/`, { method: 'DELETE' }),
};