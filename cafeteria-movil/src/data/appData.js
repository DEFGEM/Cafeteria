export const dashboardStats = [
  { icon: '🧾', value: '12', label: 'Pedidos' },
  { icon: '🍽️', value: '5', label: 'Activos' },
  { icon: '⚠️', value: '3', label: 'Stock bajo' },
];

export const dashboardModules = [
  {
    icon: '🧍',
    title: 'Cliente / Mesero',
    description: 'Levantar pedidos y revisar estado.',
    target: 'customer',
  },
  {
    icon: '💵',
    title: 'Caja',
    description: 'Pagos, tickets, ventas y gastos.',
    target: 'cashier',
  },
  {
    icon: '👨‍🍳',
    title: 'Cocina',
    description: 'Preparar pedidos e inventario.',
    target: 'kitchen',
  },
  {
    icon: '📦',
    title: 'Inventario',
    description: 'Consultar insumos disponibles.',
    target: 'kitchenInventory',
  },
];

export const kitchenStats = [
  { icon: '⏳', value: '3', label: 'Pendientes' },
  { icon: '🍳', value: '5', label: 'Preparación' },
  { icon: '✅', value: '12', label: 'Listos' },
];

export const kitchenOrders = [
  {
    id: 'Pedido #15',
    detail: 'Mesa 3 · 2 cafés · 1 pan dulce',
    status: 'Pendiente',
    statusType: 'pending',
    action: 'Preparar',
  },
  {
    id: 'Pedido #16',
    detail: 'Mesa 1 · 1 latte · 2 frappés',
    status: 'En preparación',
    statusType: 'progress',
    action: 'Marcar listo',
  },
];

export const quickKitchenActions = [
  {
    icon: '🧾',
    title: 'Pedidos',
    description: 'Ver pedidos pendientes y actualizar estado.',
    target: 'kitchenOrders',
  },
  {
    icon: '📦',
    title: 'Inventario',
    description: 'Revisar insumos y productos bajos.',
    target: 'kitchenInventory',
  },
];

export const kitchenMovements = [
  { icon: '✅', text: 'Pedido #14 marcado como listo' },
  { icon: '📦', text: 'Se descontó leche del inventario' },
];

export const inventoryStats = [
  { icon: '✅', value: '20', label: 'Normales' },
  { icon: '⚠️', value: '4', label: 'Stock bajo' },
  { icon: '🛒', value: '2', label: 'Comprar' },
];

export const inventoryItems = [
  {
    icon: '☕',
    name: 'Café molido',
    quantity: '5 kg disponibles',
    minimum: 'Mín: 2 kg',
    status: 'Normal',
    statusType: 'normal',
  },
  {
    icon: '🥛',
    name: 'Leche',
    quantity: '2 litros disponibles',
    minimum: 'Mín: 5 L',
    status: 'Bajo',
    statusType: 'low',
  },
  {
    icon: '🍫',
    name: 'Chocolate',
    quantity: '1 kg disponible',
    minimum: 'Mín: 3 kg',
    status: 'Bajo',
    statusType: 'low',
  },
];

export const quickInventoryActions = [
  {
    icon: '➕',
    title: 'Agregar',
    description: 'Nuevo insumo',
  },
  {
    icon: '🛒',
    title: 'Compra',
    description: 'Registrar entrada',
  },
];

export const inventoryMovements = [
  { icon: '📉', text: 'Se descontó leche por Pedido #16' },
  { icon: '📦', text: 'Se agregó café molido al inventario' },
];

export const menuActions = [
  { icon: '➕', label: 'Agregar platillo' },
  { icon: '🎁', label: 'Agregar promoción' },
  { icon: '⭐', label: 'Agregar menú especial', wide: true },
];

export const menuSections = [
  {
    title: 'Menú actual',
    subtitle: 'Productos disponibles para pedidos',
    items: [
      {
        icon: '☕',
        name: 'Café americano',
        detail: 'Bebida caliente · $35.00',
      },
      {
        icon: '🥐',
        name: 'Pan dulce',
        detail: 'Panadería · $25.00',
      },
    ],
  },
  {
    title: 'Combos',
    items: [
      {
        icon: '🥪',
        name: 'Combo desayuno',
        detail: 'Café + pan · $55.00',
      },
    ],
  },
  {
    title: 'Menú de temporada',
    items: [
      {
        icon: '🍫',
        name: 'Chocolate especial',
        detail: 'Temporada · $48.00',
      },
    ],
  },
];

export const cashierStats = [
  { icon: '🧾', value: '18', label: 'Pedidos' },
  { icon: '💰', value: '$980', label: 'Ganancia' },
  { icon: '🛒', value: '$450', label: 'Gastos' },
];

export const cashierModules = [
  {
    icon: '🧾',
    title: 'Pedidos',
    description: 'Recibir pedidos y revisar detalles.',
    buttonLabel: 'Entrar',
    target: 'cashierOrders',
  },
  {
    icon: '💳',
    title: 'Cuentas',
    description: 'Procesar pagos y generar tickets.',
    buttonLabel: 'Entrar',
  },
  {
    icon: '📈',
    title: 'Ganancias',
    description: 'Consultar ingresos, gastos y cortes.',
    buttonLabel: 'Ver',
    target: 'cashierAccounts',
  },
  {
    icon: '🛒',
    title: 'Suministros',
    description: 'Registrar compras de insumos.',
    buttonLabel: 'Registrar',
    target: 'cashierPurchases',
  },
];

export const cashierMovements = [
  { icon: '✅', text: 'Pedido #24 pagado con tarjeta' },
  { icon: '🧾', text: 'Ticket generado para Mesa 5' },
  { icon: '🛒', text: 'Compra de leche registrada' },
];

export const cashierOrderStats = [
  { icon: '🧾', value: '9', label: 'Recibidos' },
  { icon: '✅', value: '14', label: 'Confirmados' },
  { icon: '❌', value: '2', label: 'Cancelados' },
];

export const cashierOrderMovements = [
  { icon: '✅', text: 'Pedido #23 confirmado y enviado a cocina' },
  { icon: '❌', text: 'Pedido #21 cancelado por caja' },
];

export const cashierAccountStats = [
  { icon: '💵', value: '$4,850', label: 'Ventas' },
  { icon: '🧾', value: '$1,870', label: 'Gastos' },
  { icon: '✅', value: '$2,980', label: 'Ganancia' },
];

export const accountRows = [
  {
    label: 'Ventas totales',
    value: '$4,850.00',
    badge: 'Ingreso',
    type: 'income',
  },
  {
    label: 'Gastos registrados',
    value: '$1,870.00',
    badge: 'Gasto',
    type: 'expense',
  },
  {
    label: 'Compras de suministros',
    value: '$950.00',
    badge: 'Compra',
    type: 'expense',
  },
  {
    label: 'Total en caja',
    value: '$2,980.00',
    badge: 'Ganancia',
    type: 'profit',
    final: true,
  },
];

export const accountMovements = [
  { icon: '💵', text: 'Venta registrada por Pedido #24' },
  { icon: '🧾', text: 'Gasto registrado: compra de servilletas' },
  { icon: '🛒', text: 'Compra de leche agregada a cuentas' },
];

export const cashierPurchaseStats = [
  { icon: '🛒', value: '5', label: 'Compras' },
  { icon: '📦', value: '12', label: 'Insumos' },
  { icon: '⚠️', value: '3', label: 'Urgentes' },
];

export const purchases = [
  {
    icon: '🥛',
    name: 'Leche',
    detail: '10 litros · Hoy 10:30 AM',
    amount: '$320',
    status: 'Registrada',
    type: 'paid',
  },
  {
    icon: '☕',
    name: 'Café molido',
    detail: '5 kg · Hoy 11:15 AM',
    amount: '$480',
    status: 'Registrada',
    type: 'paid',
  },
  {
    icon: '🥤',
    name: 'Vasos',
    detail: '100 piezas · Pendiente',
    amount: '$150',
    status: 'Pendiente',
    type: 'pending',
  },
];

export const purchaseMovements = [
  { icon: '📦', text: 'Compra de leche agregada al inventario' },
  { icon: '💵', text: 'Gasto registrado automáticamente en cuentas' },
];

export const customerStats = [
  { icon: '🍽️', value: '6', label: 'Mesas' },
  { icon: '⏳', value: '4', label: 'En proceso' },
  { icon: '✅', value: '11', label: 'Entregados' },
];

export const customerModules = [
  {
    icon: '📝',
    title: 'Realizar pedido',
    description: 'Seleccionar mesa, productos y cantidades.',
    buttonLabel: 'Entrar',
    target: 'customerOrder',
  },
  {
    icon: '🧾',
    title: 'Mis pedidos',
    description: 'Revisar pedidos activos y finalizados.',
    buttonLabel: 'Ver',
    target: 'customerOrders',
  },
  {
    icon: '📢',
    title: 'Marketing',
    description: 'Promociones y productos recomendados.',
    buttonLabel: 'Revisar',
    target: 'customerMarketing',
  },
  {
    icon: '☕',
    title: 'Más vendido',
    description: 'Café americano recomendado al cliente.',
    buttonLabel: 'Sugerir',
  },
];

export const customerMovements = [
  { icon: '🧾', text: 'Pedido #31 enviado a caja' },
  { icon: '✅', text: 'Pedido #28 entregado al cliente' },
  { icon: '📢', text: 'Promoción sugerida en Mesa 4' },
];
