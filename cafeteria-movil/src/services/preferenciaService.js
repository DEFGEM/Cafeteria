import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const preferenciaService = {
  get: (params = {}) => httpClient.get(endpoints.preferencias.root, { query: params }),
  update: (data) => httpClient.put(endpoints.preferencias.root, data),
  detail: (params = {}) => httpClient.get(endpoints.preferencias.detail, { query: params }),
  updateBatch: (data) => httpClient.put(endpoints.preferencias.batch, data),
  getKey: (key) => httpClient.get(endpoints.preferencias.byKey(key)),
  updateKey: (key, value) => httpClient.put(endpoints.preferencias.byKey(key), { valor: value }),
};

export default preferenciaService;
