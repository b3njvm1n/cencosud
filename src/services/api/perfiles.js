// src/services/apis/perfiles.js
import { apiFetchWithRefresh } from './fetch';

export const perfiles = {
  getAll: (params = '') => apiFetchWithRefresh(`/perfiles/${params}`),
  get: (id) => apiFetchWithRefresh(`/perfiles/${id}/`),
  me: () => apiFetchWithRefresh('/perfiles/me/'),
};