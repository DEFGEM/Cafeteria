import httpClient from '../api/client';
import endpoints from '../api/endpoints';
import { adaptUser } from '../adapters/roleAdapter';

function adaptUsers(data) {
  return Array.isArray(data) ? data.map(adaptUser) : [];
}

export const usuarioService = {
  async list(params = {}) {
    return adaptUsers(await httpClient.get(endpoints.usuarios.root, { query: params }));
  },

  async get(id) {
    return adaptUser(await httpClient.get(endpoints.usuarios.byId(id)));
  },

  async create(data) {
    return adaptUser(await httpClient.post(endpoints.usuarios.root, data));
  },

  async update(id, data) {
    return adaptUser(await httpClient.put(endpoints.usuarios.byId(id), data));
  },

  remove(id) {
    return httpClient.delete(endpoints.usuarios.byId(id));
  },
};

export default usuarioService;
