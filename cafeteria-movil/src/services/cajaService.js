import httpClient from '../api/client';
import endpoints from '../api/endpoints';
import { adaptDetallePedido, adaptPedido } from '../adapters/dataAdapters';

export const cajaService = {
  async listOrders() {
    const data = await httpClient.get(endpoints.caja.orders);
    return Array.isArray(data) ? data.map(adaptPedido).filter(Boolean) : [];
  },

  async listHistory(params = {}) {
    const {
      includeCancelled,
      incluir_cancelados: incluirCancelados,
      ...pagination
    } = params;
    const query = {
      ...pagination,
      incluir_cancelados: incluirCancelados ?? includeCancelled ?? true,
    };
    const data = await httpClient.get(endpoints.caja.history, { query });

    return Array.isArray(data) ? data.map(adaptPedido).filter(Boolean) : [];
  },

  async getOrderDetails(id) {
    const data = await httpClient.get(endpoints.caja.details(id));
    return Array.isArray(data) ? data.map(adaptDetallePedido).filter(Boolean) : [];
  },

  async charge(id, payment = {}) {
    const payload = {
      metodo_pago: payment.metodo_pago ?? payment.method ?? payment.paymentMethod,
      monto_recibido: payment.monto_recibido ?? payment.amountReceived,
      referencia_pago: payment.referencia_pago ?? payment.referencia ?? payment.reference,
    };
    const body = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

    return adaptPedido(await httpClient.post(endpoints.caja.charge(id), body));
  },
};

export default cajaService;
