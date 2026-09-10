import httpClient from '../api/client';
import endpoints from '../api/endpoints';
import { adaptDetallePedido, adaptPedido, toPedidoCompletoPayload } from '../adapters/dataAdapters';
import { toApiOrderStatus } from '../adapters/statusAdapter';

function adaptOrderList(data) {
  return Array.isArray(data) ? data.map(adaptPedido).filter(Boolean) : [];
}

function normalizeNewOrder(tableOrData) {
  if (typeof tableOrData === 'object' && tableOrData !== null) {
    return { id_mesa: tableOrData.id_mesa ?? tableOrData.tableId ?? tableOrData.id };
  }

  return { id_mesa: tableOrData };
}

function normalizeOrderItem(orderOrData, productId, quantity) {
  if (typeof orderOrData === 'object' && orderOrData !== null) {
    return {
      id_pedido: orderOrData.id_pedido ?? orderOrData.orderId,
      id_producto: orderOrData.id_producto ?? orderOrData.productId,
      cantidad: orderOrData.cantidad ?? orderOrData.quantity,
    };
  }

  return { id_pedido: orderOrData, id_producto: productId, cantidad: quantity };
}

export const pedidoService = {
  async list(params = {}) {
    return adaptOrderList(await httpClient.get(endpoints.pedidos.root, { query: params }));
  },

  async get(id) {
    return adaptPedido(await httpClient.get(endpoints.pedidos.byId(id)));
  },

  async getDetails(id) {
    const data = await httpClient.get(endpoints.pedidos.details(id));
    return Array.isArray(data) ? data.map(adaptDetallePedido).filter(Boolean) : [];
  },

  async create(tableOrData) {
    return adaptPedido(await httpClient.post(endpoints.pedidos.root, normalizeNewOrder(tableOrData)));
  },

  async createComplete(order) {
    return adaptPedido(await httpClient.post(endpoints.pedidos.complete, toPedidoCompletoPayload(order)));
  },

  async addItem(orderOrData, productId, quantity) {
    const data = normalizeOrderItem(orderOrData, productId, quantity);
    return adaptDetallePedido(await httpClient.post(endpoints.pedidos.detailRoot, data));
  },

  removeItem(detailId) {
    return httpClient.delete(endpoints.pedidos.detailById(detailId));
  },

  async updateStatus(id, status) {
    const apiStatus = toApiOrderStatus(status) ?? status;
    return adaptPedido(await httpClient.put(endpoints.pedidos.status(id), { estado: apiStatus }));
  },

  async cancel(id) {
    return adaptPedido(await httpClient.put(endpoints.pedidos.cancel(id)));
  },
};

export default pedidoService;
