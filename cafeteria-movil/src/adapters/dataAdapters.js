import { resolveApiUrl } from '../config/environment';
import { getOrderStatusDefinition } from './statusAdapter';

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function resolveMediaUrl(path) {
  if (!path) return null;
  if (/^(https?:|data:|file:)/i.test(path)) return path;
  return resolveApiUrl(path);
}

export function adaptMesa(mesa) {
  if (!mesa) return null;

  const number = mesa.numero ?? mesa.number;
  const state = mesa.estado ?? mesa.state ?? mesa.status ?? '';

  return {
    id: mesa.id_mesa ?? mesa.id,
    number,
    name: mesa.nombre ?? mesa.name ?? `Mesa ${number}`,
    label: mesa.nombre ?? mesa.name ?? `Mesa ${number}`,
    capacity: asNumber(mesa.capacidad ?? mesa.capacity),
    state,
    status: String(state).toLowerCase(),
    available: String(state).toLowerCase() === 'libre',
    raw: mesa,
  };
}

export function adaptProducto(producto) {
  if (!producto) return null;

  const stock = asNumber(producto.stock);
  const active = producto.activo ?? producto.active ?? true;
  const category = producto.categoria ?? producto.category;

  return {
    id: producto.id_producto ?? producto.id,
    name: producto.nombre ?? producto.name ?? '',
    description: producto.descripcion ?? producto.description ?? '',
    price: asNumber(producto.precio ?? producto.price),
    stock,
    active,
    available: Boolean(active && stock > 0),
    imageUrl: resolveMediaUrl(producto.imagen ?? producto.imageUrl ?? producto.image),
    categoryId: producto.id_categoria ?? producto.categoryId ?? category?.id_categoria ?? category?.id ?? null,
    category: category?.nombre ?? category?.name ?? category ?? '',
    icon: producto.icono ?? producto.icon ?? '☕',
    quantity: asNumber(producto.quantity ?? producto.cantidad),
    raw: producto,
  };
}

export function adaptDetallePedido(detail) {
  if (!detail) return null;

  const product = detail.producto ?? detail.product;
  const quantity = asNumber(detail.cantidad ?? detail.quantity);
  const unitPrice = asNumber(detail.precio_unitario ?? detail.unitPrice ?? detail.price);

  return {
    id: detail.id_detalle ?? detail.id,
    orderId: detail.id_pedido ?? detail.orderId ?? null,
    productId: detail.id_producto ?? detail.productId ?? product?.id_producto ?? product?.id ?? null,
    product: typeof product === 'string' ? product : product?.nombre ?? product?.name ?? '',
    name: typeof product === 'string' ? product : product?.nombre ?? product?.name ?? '',
    quantity,
    unitPrice,
    subtotal: asNumber(detail.subtotal, quantity * unitPrice),
    notes: detail.observaciones ?? detail.notes ?? '',
    promotionId: detail.id_promocion ?? detail.promotionId ?? null,
    discount: asNumber(detail.descuento ?? detail.discount),
    raw: detail,
  };
}

export function adaptPedido(pedido) {
  if (!pedido) return null;

  const status = getOrderStatusDefinition(pedido.estado ?? pedido.status);
  const table = pedido.mesa ?? pedido.table;
  const details = pedido.detalles ?? pedido.details ?? pedido.items;
  const tableId = pedido.id_mesa ?? pedido.tableId ?? table?.id_mesa ?? table?.id ?? null;
  const apiId = pedido.id_pedido ?? pedido.apiId ?? pedido.id;
  const tableNumber = table?.numero ?? table?.number ?? tableId;
  const tableName = typeof table === 'string'
    ? table
    : table?.nombre ?? table?.name ?? (tableNumber ? `Mesa ${tableNumber}` : '');
  const adaptedItems = Array.isArray(details) ? details.map(adaptDetallePedido).filter(Boolean) : [];
  const productSummary = adaptedItems
    .map((item) => `${item.quantity} ${item.name}`.trim())
    .filter(Boolean)
    .join(', ');
  const total = asNumber(pedido.total);
  const stepByStatus = { pending: 1, preparing: 2, ready: 3, paid: 4, cancelled: 0 };

  return {
    id: typeof pedido.id === 'string' && pedido.id.toLowerCase().includes('pedido')
      ? pedido.id
      : `Pedido #${apiId}`,
    apiId,
    orderNumber: pedido.numero ?? pedido.orderNumber ?? apiId,
    state: status?.label ?? pedido.estado ?? pedido.status ?? '',
    status: status?.label ?? pedido.estado ?? pedido.status ?? '',
    statusId: status?.id ?? null,
    statusType: status?.type ?? 'pending',
    stepsDone: stepByStatus[status?.id] ?? 0,
    kitchenStage: status?.id === 'preparing' ? 'preparing' : status?.id === 'ready' ? 'ready' : 'queue',
    total,
    amount: `$${total.toFixed(2)}`,
    tableId,
    table: tableName,
    tableName,
    detail: productSummary ? `${tableName} · ${productSummary}` : tableName,
    userId: pedido.id_usuario ?? pedido.userId ?? null,
    notes: pedido.observaciones ?? pedido.notes ?? '',
    products: productSummary,
    createdAt: pedido.creado_en ?? pedido.fecha ?? pedido.created_at ?? pedido.createdAt ?? null,
    preparationStartedAt: pedido.preparacion_iniciada_en ?? pedido.preparationStartedAt ?? null,
    readyAt: pedido.listo_en ?? pedido.readyAt ?? null,
    kitchenDelayReportedAt: pedido.demora_reportada_en ?? pedido.kitchenDelayReportedAt ?? null,
    kitchenNote: pedido.nota_cocina ?? pedido.kitchenNote ?? null,
    paidAt: pedido.pagado_en ?? pedido.paidAt ?? null,
    paymentMethod: pedido.metodo_pago ?? pedido.paymentMethod ?? null,
    amountReceived: asNumber(pedido.monto_recibido ?? pedido.amountReceived, 0),
    change: asNumber(pedido.cambio ?? pedido.change, 0),
    paymentReference: pedido.referencia_pago ?? pedido.paymentReference ?? null,
    cashierUserId: pedido.id_usuario_caja ?? pedido.cashierUserId ?? null,
    items: adaptedItems,
    raw: pedido,
  };
}

export function adaptDashboard(data) {
  const source = data ?? {};

  return {
    earnings: asNumber(source.ganancias ?? source.ventas ?? source.earnings),
    orders: asNumber(source.ordenes ?? source.pedidos ?? source.orders),
    users: asNumber(source.usuarios ?? source.users),
    products: asNumber(source.productos ?? source.products),
    categories: asNumber(source.categorias ?? source.categories),
    occupiedTables: asNumber(source.mesas_ocupadas ?? source.occupiedTables),
    lowStock: asNumber(source.stock_bajo ?? source.lowStock),
    bars: {
      sales: asNumber(source.ventas_barra ?? source.salesBar),
      orders: asNumber(source.pedidos_barra ?? source.ordersBar),
      products: asNumber(source.productos_barra ?? source.productsBar),
      users: asNumber(source.usuarios_barra ?? source.usersBar),
    },
    supplies: source.insumos ?? source.supplies ?? [],
    raw: source,
  };
}

export function toPedidoCompletoPayload(order) {
  const tableId = order?.id_mesa ?? order?.tableId ?? order?.mesa?.id_mesa ?? order?.mesa?.id;
  const sourceItems = order?.productos ?? order?.items ?? [];

  return {
    id_mesa: tableId,
    observaciones: order?.observaciones ?? order?.notes ?? '',
    productos: sourceItems.map((item) => ({
      id_producto: item.id_producto ?? item.productId ?? item.producto?.id_producto ?? item.producto?.id ?? item.id,
      cantidad: asNumber(item.cantidad ?? item.quantity),
      ...((item.id_promocion ?? item.promotionId) ? {
        id_promocion: item.id_promocion ?? item.promotionId,
      } : {}),
    })),
  };
}
