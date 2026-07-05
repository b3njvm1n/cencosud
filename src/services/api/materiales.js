// src/services/api/materiales.js
import { apiFetchWithRefresh } from './fetch';

export const materiales = {
  getAll: (params = '') => apiFetchWithRefresh(`/materiales/${params}`),
  get: (id) => apiFetchWithRefresh(`/materiales/${id}/`),
  create: (data) => apiFetchWithRefresh('/materiales/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/materiales/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/materiales/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/materiales/${id}/`, { method: 'DELETE' }),
};