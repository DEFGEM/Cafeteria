import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const promocionService = {
  list: (params = {}) => httpClient.get(endpoints.promociones.root, { query: params }),
  listActive: () => httpClient.get(endpoints.promociones.active),
  get: (id) => httpClient.get(endpoints.promociones.byId(id)),
  create: (data) => httpClient.post(endpoints.promociones.root, data),
  update: (id, data) => httpClient.put(endpoints.promociones.byId(id), data),
  remove: (id) => httpClient.delete(endpoints.promociones.byId(id)),
};

export default promocionService;
