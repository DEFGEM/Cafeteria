import httpClient from '../api/client';
import endpoints from '../api/endpoints';
import { adaptPedido, adaptProducto } from '../adapters/dataAdapters';

function adaptList(data, adapter) {
  return Array.isArray(data) ? data.map(adapter).filter(Boolean) : [];
}

export const reporteService = {
  summary: () => httpClient.get(endpoints.reportes.root),

  async products(params = {}) {
    return adaptList(await httpClient.get(endpoints.reportes.products, { query: params }), adaptProducto);
  },

  async orders(params = {}) {
    return adaptList(await httpClient.get(endpoints.reportes.orders, { query: params }), adaptPedido);
  },

  inventory: (params = {}) => httpClient.get(endpoints.reportes.inventory, { query: params }),
  downloadSummaryPdf: () => httpClient.get(endpoints.reportes.pdf, { responseType: 'blob' }),
  downloadSummaryExcel: () => httpClient.get(endpoints.reportes.excel, { responseType: 'blob' }),
  downloadProductsPdf: (params = {}) => httpClient.get(endpoints.reportes.productPdf, { query: params, responseType: 'blob' }),
  downloadProductsExcel: (params = {}) => httpClient.get(endpoints.reportes.productExcel, { query: params, responseType: 'blob' }),
  downloadOrdersPdf: (params = {}) => httpClient.get(endpoints.reportes.orderPdf, { query: params, responseType: 'blob' }),
  downloadOrdersExcel: (params = {}) => httpClient.get(endpoints.reportes.orderExcel, { query: params, responseType: 'blob' }),
};

export default reporteService;
