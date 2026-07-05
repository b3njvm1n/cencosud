// src/services/apis/informes.js
import { apiFetchWithRefresh } from './fetch';

export const informes = {
  getAll: (params = '') => apiFetchWithRefresh(`/informes/${params}`),
  get: (id) => apiFetchWithRefresh(`/informes/${id}/`),
  create: (data) => apiFetchWithRefresh('/informes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetchWithRefresh(`/informes/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => apiFetchWithRefresh(`/informes/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetchWithRefresh(`/informes/${id}/`, { method: 'DELETE' }),
};