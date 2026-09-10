import httpClient from '../api/client';
import endpoints from '../api/endpoints';
import { adaptProducto } from '../adapters/dataAdapters';

function toProductFormData(product) {
  if (product instanceof FormData) return product;

  const form = new FormData();
  const fields = {
    nombre: product.nombre ?? product.name,
    descripcion: product.descripcion ?? product.description ?? '',
    precio: product.precio ?? product.price,
    stock: product.stock,
    activo: product.activo ?? product.active ?? true,
    id_categoria: product.id_categoria ?? product.categoryId,
  };

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });

  const image = product.imagen ?? product.image;
  if (image) form.append('imagen', image);

  return form;
}

export const productoService = {
  async list(params = {}) {
    const data = await httpClient.get(endpoints.productos.root, { query: params });
    return Array.isArray(data) ? data.map(adaptProducto).filter(Boolean) : [];
  },

  async get(id) {
    return adaptProducto(await httpClient.get(endpoints.productos.byId(id)));
  },

  async create(data) {
    return adaptProducto(await httpClient.post(endpoints.productos.root, toProductFormData(data)));
  },

  async update(id, data) {
    return adaptProducto(await httpClient.put(endpoints.productos.byId(id), toProductFormData(data)));
  },

  remove(id) {
    return httpClient.delete(endpoints.productos.byId(id));
  },
};

export default productoService;
