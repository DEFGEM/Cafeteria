import httpClient from '../api/client';
import endpoints from '../api/endpoints';
import { adaptDetallePedido, adaptPedido } from '../adapters/dataAdapters';

export const cocinaService = {
  async listOrders() {
    const data = await httpClient.get(endpoints.cocina.orders);
    return Array.isArray(data) ? data.map(adaptPedido).filter(Boolean) : [];
  },

  async getOrderDetails(id) {
    const data = await httpClient.get(endpoints.cocina.details(id));
    return Array.isArray(data) ? data.map(adaptDetallePedido).filter(Boolean) : [];
  },

  async startPreparation(id) {
    return adaptPedido(await httpClient.put(endpoints.cocina.prepare(id)));
  },

  async markReady(id) {
    return adaptPedido(await httpClient.put(endpoints.cocina.ready(id)));
  },

  async reportDelay(id, note) {
    return adaptPedido(await httpClient.post(endpoints.cocina.delay(id), { nota: note }));
  },
};

export default cocinaService;
