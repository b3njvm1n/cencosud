// src/services/api/ventas.js
import { apiFetchWithRefresh } from './fetch';

export const ventas = {
  getAll: (params = '') => apiFetchWithRefresh(`/ventas/${params}`),
  get: (id) => apiFetchWithRefresh(`/ventas/${id}/`),
  create: (data) => apiFetchWithRefresh('/ventas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/ventas/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/ventas/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/ventas/${id}/`, { method: 'DELETE' }),
};