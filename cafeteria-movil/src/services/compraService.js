import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const compraService = {
  list: (params = {}) => httpClient.get(endpoints.compras.root, { query: params }),
  get: (id) => httpClient.get(endpoints.compras.byId(id)),
  create: (data) => httpClient.post(endpoints.compras.root, data),
  update: (id, data) => httpClient.put(endpoints.compras.byId(id), data),
  receive: (id, data = {}) => httpClient.post(endpoints.compras.receive(id), data),
};

export default compraService;
