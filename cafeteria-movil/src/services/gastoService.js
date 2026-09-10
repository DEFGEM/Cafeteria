import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const gastoService = {
  list: (params = {}) => httpClient.get(endpoints.gastos.root, { query: params }),
  get: (id) => httpClient.get(endpoints.gastos.byId(id)),
  create: (data) => httpClient.post(endpoints.gastos.root, data),
  update: (id, data) => httpClient.put(endpoints.gastos.byId(id), data),
  remove: (id) => httpClient.delete(endpoints.gastos.byId(id)),
};

export default gastoService;
