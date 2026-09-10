export const endpoints = Object.freeze({
  health: '/health',
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  mesas: {
    root: '/mesas/',
    byId: (id) => `/mesas/${id}`,
    stats: '/mesas/estadisticas',
  },
  productos: {
    root: '/productos/',
    byId: (id) => `/productos/${id}`,
  },
  categorias: {
    root: '/categorias/',
    byId: (id) => `/categorias/${id}`,
  },
  pedidos: {
    root: '/pedidos/',
    byId: (id) => `/pedidos/${id}`,
    complete: '/pedidos/completo',
    status: (id) => `/pedidos/${id}/estado`,
    cancel: (id) => `/pedidos/${id}/cancelar`,
    details: (id) => `/detalle-pedido/pedido/${id}`,
    detailRoot: '/detalle-pedido/',
    detailById: (id) => `/detalle-pedido/${id}`,
  },
  cocina: {
    orders: '/cocina/pedidos',
    details: (id) => `/cocina/pedidos/${id}/detalle`,
    prepare: (id) => `/cocina/pedidos/${id}/preparar`,
    ready: (id) => `/cocina/pedidos/${id}/listo`,
    delay: (id) => `/cocina/pedidos/${id}/demora`,
  },
  caja: {
    orders: '/caja/pedidos',
    history: '/caja/historial',
    details: (id) => `/caja/pedidos/${id}/detalle`,
    charge: (id) => `/caja/pedidos/${id}/cobrar`,
  },
  dashboard: '/dashboard/',
  statistics: '/estadisticas/',
  usuarios: {
    root: '/usuarios/',
    byId: (id) => `/usuarios/${id}`,
  },
  roles: {
    root: '/roles/',
  },
  reportes: {
    root: '/reportes/',
    pdf: '/reportes/pdf',
    excel: '/reportes/excel',
    products: '/reportes/productos',
    productPdf: '/reportes/productos/pdf',
    productExcel: '/reportes/productos/excel',
    orders: '/reportes/pedidos',
    orderPdf: '/reportes/pedidos/pdf',
    orderExcel: '/reportes/pedidos/excel',
    inventory: '/reportes/inventario',
  },
  insumos: {
    root: '/insumos/',
    byId: (id) => `/insumos/${id}`,
    lowStock: '/insumos/stock-bajo',
    movements: (id) => `/insumos/${id}/movimientos`,
  },
  compras: {
    root: '/compras/',
    byId: (id) => `/compras/${id}`,
    receive: (id) => `/compras/${id}/recibir`,
  },
  gastos: {
    root: '/gastos/',
    byId: (id) => `/gastos/${id}`,
  },
  promociones: {
    root: '/promociones/',
    byId: (id) => `/promociones/${id}`,
    active: '/promociones/activas',
  },
  notificaciones: {
    root: '/notificaciones/',
    unreadCount: '/notificaciones/no-leidas/conteo',
    read: (id) => `/notificaciones/${id}/leer`,
  },
  actividad: '/actividad/',
  preferencias: {
    root: '/preferencias/',
    detail: '/preferencias/detalle',
    batch: '/preferencias/lote',
    byKey: (key) => `/preferencias/${encodeURIComponent(key)}`,
  },
});

export default endpoints;
