import httpClient from '../api/client';
import endpoints from '../api/endpoints';
import { adaptMesa } from '../adapters/dataAdapters';

export const mesaService = {
  async list(params = {}) {
    const data = await httpClient.get(endpoints.mesas.root, { query: params });
    return Array.isArray(data) ? data.map(adaptMesa).filter(Boolean) : [];
  },

  async get(id) {
    return adaptMesa(await httpClient.get(endpoints.mesas.byId(id)));
  },

  async create(data) {
    return adaptMesa(await httpClient.post(endpoints.mesas.root, data));
  },

  async update(id, data) {
    return adaptMesa(await httpClient.put(endpoints.mesas.byId(id), data));
  },

  remove(id) {
    return httpClient.delete(endpoints.mesas.byId(id));
  },

  stats() {
    return httpClient.get(endpoints.mesas.stats);
  },
};

export default mesaService;
