function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const ORDER_STATUS_DEFINITIONS = Object.freeze({
  pending: Object.freeze({ id: 'pending', apiStatus: 'Pendiente', label: 'Pendiente', type: 'pending' }),
  preparing: Object.freeze({ id: 'preparing', apiStatus: 'En preparación', label: 'En preparación', type: 'kitchen' }),
  ready: Object.freeze({ id: 'ready', apiStatus: 'Listo', label: 'Listo', type: 'ready' }),
  paid: Object.freeze({ id: 'paid', apiStatus: 'Pagado', label: 'Pagado', type: 'paid' }),
  cancelled: Object.freeze({ id: 'cancelled', apiStatus: 'Cancelado', label: 'Cancelado', type: 'cancelled' }),
});

const STATUS_ALIASES = Object.freeze({
  pendiente: 'pending',
  pending: 'pending',
  'en preparacion': 'preparing',
  preparando: 'preparing',
  preparing: 'preparing',
  kitchen: 'preparing',
  listo: 'ready',
  ready: 'ready',
  pagado: 'paid',
  paid: 'paid',
  cancelado: 'cancelled',
  cancelled: 'cancelled',
  canceled: 'cancelled',
});

export function toOrderStatus(status) {
  const source = status?.id ?? status?.apiStatus ?? status?.estado ?? status?.status ?? status;
  return STATUS_ALIASES[normalize(source)] ?? null;
}

export function toApiOrderStatus(status) {
  const mobileStatus = toOrderStatus(status);
  return mobileStatus ? ORDER_STATUS_DEFINITIONS[mobileStatus].apiStatus : null;
}

export function getOrderStatusDefinition(status) {
  const mobileStatus = toOrderStatus(status);
  return mobileStatus ? ORDER_STATUS_DEFINITIONS[mobileStatus] : null;
}
