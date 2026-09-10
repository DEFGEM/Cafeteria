import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const inventarioService = {
  list: (params = {}) => httpClient.get(endpoints.insumos.root, { query: params }),
  get: (id) => httpClient.get(endpoints.insumos.byId(id)),
  create: (data) => httpClient.post(endpoints.insumos.root, data),
  update: (id, data) => httpClient.put(endpoints.insumos.byId(id), data),
  remove: (id) => httpClient.delete(endpoints.insumos.byId(id)),
  listLowStock: () => httpClient.get(endpoints.insumos.lowStock),
  addMovement: (id, data) => httpClient.post(endpoints.insumos.movements(id), data),
  listMovements: (id, params = {}) => httpClient.get(endpoints.insumos.movements(id), { query: params }),
};

export default inventarioService;
