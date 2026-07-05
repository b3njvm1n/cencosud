// src/services/apis/atenciones.js
import { apiFetchWithRefresh } from './fetch';

export const atenciones = {
  getAll: (params = '') => apiFetchWithRefresh(`/atenciones/${params}`),
  get: (id) => apiFetchWithRefresh(`/atenciones/${id}/`),
  create: (data) => apiFetchWithRefresh('/atenciones/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/atenciones/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/atenciones/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/atenciones/${id}/`, { method: 'DELETE' }),
};