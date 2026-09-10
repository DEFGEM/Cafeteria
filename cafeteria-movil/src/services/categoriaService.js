import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const categoriaService = {
  list: () => httpClient.get(endpoints.categorias.root),
  get: (id) => httpClient.get(endpoints.categorias.byId(id)),
  create: (data) => httpClient.post(endpoints.categorias.root, data),
  update: (id, data) => httpClient.put(endpoints.categorias.byId(id), data),
  remove: (id) => httpClient.delete(endpoints.categorias.byId(id)),
};

export default categoriaService;
