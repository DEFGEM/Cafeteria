import { StatusBar } from 'expo-status-bar';
import BottomNav from './src/components/BottomNav';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import CashierAccountsScreen from './src/screens/CashierAccountsScreen';
import CashierOrderDetailScreen from './src/screens/CashierOrderDetailScreen';
import CashierOrdersScreen from './src/screens/CashierOrdersScreen';
import CashierPurchasesScreen from './src/screens/CashierPurchasesScreen';
import CashierScreen from './src/screens/CashierScreen';
import CustomerMarketingScreen from './src/screens/CustomerMarketingScreen';
import CustomerOrdersScreen from './src/screens/CustomerOrdersScreen';
import CustomerOrderScreen from './src/screens/CustomerOrderScreen';
import CustomerScreen from './src/screens/CustomerScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import KitchenInventoryScreen from './src/screens/KitchenInventoryScreen';
import KitchenMenuScreen from './src/screens/KitchenMenuScreen';
import KitchenOrdersScreen from './src/screens/KitchenOrdersScreen';
import KitchenScreen from './src/screens/KitchenScreen';
import LoginScreen from './src/screens/LoginScreen';
import ServerConfigScreen from './src/screens/ServerConfigScreen';
import HelpScreen from './src/screens/HelpScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { SessionProvider, useSession } from './src/context/SessionContext';
import {
  actividadService,
  cajaService,
  categoriaService,
  cocinaService,
  compraService,
  gastoService,
  inventarioService,
  mesaService,
  notificacionService,
  pedidoService,
  preferenciaService,
  productoService,
  promocionService,
} from './src/services';
import { themes } from './src/theme/themes';

const initialCustomerOrders = [
  {
    id: 'Pedido #31',
    detail: 'Mesa 2 · Café americano, pan dulce',
    status: 'En cocina',
    statusType: 'kitchen',
    stepsDone: 2,
    amount: '$95.00',
    action: 'Ver detalle',
    products: '2 cafés americanos, 1 pan dulce',
    notes: 'Sin azúcar en un café.',
  },
  {
    id: 'Pedido #32',
    detail: 'Mesa 4 · Latte, frappé, galleta',
    status: 'Listo',
    statusType: 'ready',
    stepsDone: 3,
    amount: '$160.00',
    action: 'Entregar',
    actionType: 'deliver',
    products: '1 latte, 1 frappé, 1 galleta artesanal',
    notes: 'Frappé sin crema.',
  },
  {
    id: 'Pedido #29',
    detail: 'Mesa 1 · Chocolate caliente',
    status: 'Entregado',
    statusType: 'delivered',
    stepsDone: 4,
    amount: '$48.00',
    action: 'Detalle',
    products: '1 chocolate caliente',
    notes: 'Entregado al cliente.',
  },
];

const initialCustomerDraft = {
  selectedTable: 'Mesa 3',
  observations: 'Sin azúcar en un café. Pan dulce para llevar.',
  products: [
    {
      icon: '☕',
      name: 'Café americano',
      price: 35,
      quantity: 2,
    },
    {
      icon: '🥐',
      name: 'Pan dulce',
      price: 25,
      quantity: 1,
    },
    {
      icon: '🥤',
      name: 'Frappé',
      price: 55,
      quantity: 0,
    },
    {
      icon: '🥛',
      name: 'Latte',
      price: 45,
      quantity: 0,
    },
    {
      icon: '🍳',
      name: 'Combo desayuno',
      price: 55,
      quantity: 0,
    },
    {
      icon: '🍫',
      name: 'Chocolate caliente',
      price: 48,
      quantity: 0,
    },
    {
      icon: '🥪',
      name: 'Sándwich de jamón',
      price: 65,
      quantity: 0,
    },
    {
      icon: '🍪',
      name: 'Galleta artesanal',
      price: 22,
      quantity: 0,
    },
    {
      icon: '🧊',
      name: 'Café frío',
      price: 42,
      quantity: 0,
    },
  ],
};

const initialKitchenMenuItems = [
  {
    id: 'menu-coffee',
    category: 'Bebidas',
    icon: '☕',
    name: 'Café americano',
    price: 35,
    available: true,
    featured: true,
    type: 'Platillo',
    description: 'Bebida caliente',
  },
  {
    id: 'menu-bread',
    category: 'Panadería',
    icon: '🥐',
    name: 'Pan dulce',
    price: 25,
    available: true,
    featured: false,
    type: 'Platillo',
    description: 'Panadería',
  },
  {
    id: 'menu-frappe',
    category: 'Bebidas',
    icon: '🥤',
    name: 'Frappé',
    price: 55,
    available: true,
    featured: false,
    type: 'Platillo',
    description: 'Bebida fría',
  },
  {
    id: 'menu-latte',
    category: 'Bebidas',
    icon: '🥛',
    name: 'Latte',
    price: 45,
    available: true,
    featured: false,
    type: 'Platillo',
    description: 'Café con leche',
  },
  {
    id: 'menu-breakfast-combo',
    category: 'Combos',
    icon: '🍳',
    name: 'Combo desayuno',
    price: 55,
    available: true,
    featured: true,
    type: 'Combo',
    description: 'Café + pan',
  },
  {
    id: 'menu-hot-chocolate',
    category: 'Temporada',
    icon: '🍫',
    name: 'Chocolate caliente',
    price: 48,
    available: true,
    featured: false,
    type: 'Especial',
    description: 'Temporada',
  },
  {
    id: 'menu-sandwich',
    category: 'Alimentos',
    icon: '🥪',
    name: 'Sándwich de jamón',
    price: 65,
    available: true,
    featured: false,
    type: 'Platillo',
    description: 'Alimento preparado',
  },
  {
    id: 'menu-cookie',
    category: 'Panadería',
    icon: '🍪',
    name: 'Galleta artesanal',
    price: 22,
    available: true,
    featured: false,
    type: 'Platillo',
    description: 'Postre',
  },
  {
    id: 'menu-cold-coffee',
    category: 'Bebidas',
    icon: '🧊',
    name: 'Café frío',
    price: 42,
    available: true,
    featured: false,
    type: 'Platillo',
    description: 'Bebida fría',
  },
];

const initialCashierExpenses = [
  {
    id: 'expense-operation',
    amount: 920,
    category: 'OperaciÃ³n',
    description: 'Gastos registrados',
  },
  {
    id: 'expense-purchase-milk',
    amount: 320,
    category: 'Suministros',
    description: 'Compra de leche',
  },
  {
    id: 'expense-purchase-coffee',
    amount: 480,
    category: 'Suministros',
    description: 'Compra de cafÃ© molido',
  },
];

const initialCashierPurchases = [
  {
    id: 'purchase-milk',
    expenseId: 'expense-purchase-milk',
    icon: 'ðŸ¥›',
    name: 'Leche',
    quantity: '10',
    unit: 'litros',
    detail: '10 litros Â· Hoy 10:30 AM',
    amount: 320,
    status: 'Registrada',
    type: 'paid',
    urgent: false,
  },
  {
    id: 'purchase-coffee',
    expenseId: 'expense-purchase-coffee',
    icon: 'â˜•',
    name: 'CafÃ© molido',
    quantity: '5',
    unit: 'kg',
    detail: '5 kg Â· Hoy 11:15 AM',
    amount: 480,
    status: 'Registrada',
    type: 'paid',
    urgent: false,
  },
  {
    id: 'purchase-cups',
    icon: 'ðŸ¥¤',
    name: 'Vasos',
    quantity: '100',
    unit: 'piezas',
    detail: '100 piezas Â· Pendiente',
    amount: 150,
    status: 'Pendiente',
    type: 'pending',
    urgent: true,
  },
];

const initialKitchenInventory = [
  {
    id: 'supply-coffee',
    icon: '☕',
    name: 'Café molido',
    quantity: 5,
    unit: 'kg',
    minimum: 2,
    category: 'Bebidas',
    updatedAt: 'Hoy 11:15 AM',
  },
  {
    id: 'supply-milk',
    icon: '🥛',
    name: 'Leche',
    quantity: 2,
    unit: 'litros',
    minimum: 5,
    category: 'Lácteos',
    updatedAt: 'Hoy 10:30 AM',
  },
  {
    id: 'supply-chocolate',
    icon: '🍫',
    name: 'Chocolate',
    quantity: 1,
    unit: 'kg',
    minimum: 3,
    category: 'Bebidas',
    updatedAt: 'Hoy 9:20 AM',
  },
  {
    id: 'supply-cups',
    icon: '🥤',
    name: 'Vasos',
    quantity: 42,
    unit: 'piezas',
    minimum: 60,
    category: 'Desechables',
    updatedAt: 'Ayer',
  },
  {
    id: 'supply-napkins',
    icon: '🧻',
    name: 'Servilletas',
    quantity: 8,
    unit: 'paquetes',
    minimum: 4,
    category: 'Desechables',
    updatedAt: 'Ayer',
  },
];

const initialUserProfile = {
  name: '',
  role: '',
  email: '',
  phone: '',
  shift: '',
};

const allRoleScreens = [
  'activity',
  'cashier',
  'cashierAccounts',
  'cashierOrderDetail',
  'cashierOrders',
  'cashierPurchases',
  'customer',
  'customerMarketing',
  'customerOrder',
  'customerOrders',
  'dashboard',
  'help',
  'kitchen',
  'kitchenInventory',
  'kitchenMenu',
  'kitchenOrders',
  'login',
  'notifications',
  'profile',
  'serverConfig',
  'settings',
];

const roleOptions = [
  {
    id: 'waiter',
    icon: '🧍',
    label: 'Mesero',
    description: 'Pedidos, mesas y promociones',
    name: 'Usuario Mesero',
    email: 'mesero@cafeteria.local',
    defaultScreen: 'dashboard',
    moduleTargets: ['customer'],
    drawerTargets: ['dashboard', 'customer', 'notifications', 'activity', 'profile', 'settings', 'help'],
    allowedScreens: ['dashboard', 'customer', 'customerMarketing', 'customerOrder', 'customerOrders', 'notifications', 'activity', 'profile', 'settings', 'help', 'login', 'serverConfig'],
  },
  {
    id: 'cashier',
    icon: '💵',
    label: 'Cajero',
    description: 'Pagos, cuentas y compras',
    name: 'Usuario Caja',
    email: 'caja@cafeteria.local',
    defaultScreen: 'dashboard',
    moduleTargets: ['cashier'],
    drawerTargets: ['dashboard', 'cashier', 'notifications', 'activity', 'profile', 'settings', 'help'],
    allowedScreens: ['dashboard', 'cashier', 'cashierAccounts', 'cashierOrderDetail', 'cashierOrders', 'cashierPurchases', 'notifications', 'activity', 'profile', 'settings', 'help', 'login', 'serverConfig'],
  },
  {
    id: 'kitchen',
    icon: '👨‍🍳',
    label: 'Cocina',
    description: 'Pedidos, inventario y menú',
    name: 'Usuario Cocina',
    email: 'cocina@cafeteria.local',
    defaultScreen: 'dashboard',
    moduleTargets: ['kitchen', 'kitchenInventory'],
    drawerTargets: ['dashboard', 'kitchen', 'notifications', 'activity', 'profile', 'settings', 'help'],
    allowedScreens: ['dashboard', 'kitchen', 'kitchenInventory', 'kitchenMenu', 'kitchenOrders', 'notifications', 'activity', 'profile', 'settings', 'help', 'login', 'serverConfig'],
  },
  {
    id: 'admin',
    icon: '☕',
    label: 'Administrador',
    description: 'Acceso completo al sistema',
    name: 'Usuario Administrador',
    email: 'admin@cafeteria.local',
    defaultScreen: 'dashboard',
    moduleTargets: ['customer', 'cashier', 'kitchen', 'kitchenInventory'],
    drawerTargets: ['dashboard', 'customer', 'cashier', 'kitchen', 'notifications', 'activity', 'profile', 'settings', 'help'],
    allowedScreens: allRoleScreens,
  },
];

const roleMap = roleOptions.reduce((roles, role) => ({ ...roles, [role.id]: role }), {});

const initialAppSettings = {
  autoSync: true,
  cashierConfirmations: true,
  compactCards: false,
  kitchenDelayAlerts: true,
  lowStockAlerts: true,
  orderNotifications: true,
};

const initialSystemEvents = [
  {
    id: 'event-start-ready',
    createdAt: 'Hoy 9:41',
    detail: 'Pedido #32 listo para entregar a Mesa 4.',
    icon: '✅',
    module: 'Cocina',
    severity: 'success',
    title: 'Pedido listo',
    type: 'notification',
  },
  {
    id: 'event-start-stock',
    createdAt: 'Hoy 9:38',
    detail: 'Leche y chocolate estan por debajo del minimo configurado.',
    icon: '⚠️',
    module: 'Inventario',
    severity: 'warning',
    title: 'Stock bajo',
    type: 'notification',
  },
  {
    id: 'event-start-payment',
    createdAt: 'Hoy 9:35',
    detail: 'Caja confirmo un pago y envio el pedido a cocina.',
    icon: '💵',
    module: 'Caja',
    severity: 'success',
    title: 'Pago confirmado',
    type: 'activity',
  },
];

const emptyCustomerDraft = {
  selectedTable: null,
  selectedTableId: null,
  observations: '',
  products: [],
};

const statusSteps = {
  cancelled: 1,
  kitchen: 2,
  paid: 4,
  pending: 1,
  ready: 3,
};

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

const settingKeyMap = {
  autosync: 'autoSync',
  cashierconfirmations: 'cashierConfirmations',
  compactcards: 'compactCards',
  kitchendelayalerts: 'kitchenDelayAlerts',
  lowstockalerts: 'lowStockAlerts',
  ordernotifications: 'orderNotifications',
};

function normalizeRemoteSettings(settings) {
  return Object.fromEntries(Object.entries(settings || {}).map(([key, value]) => [
    settingKeyMap[String(key).replace(/[^a-z0-9]/gi, '').toLowerCase()] || key,
    value,
  ]));
}

function apiOrderId(orderOrId) {
  if (typeof orderOrId === 'number') return orderOrId;
  if (typeof orderOrId === 'string') {
    const match = orderOrId.match(/\d+/);
    return match ? Number(match[0]) : orderOrId;
  }
  return orderOrId?.apiId ?? orderOrId?.orderNumber ?? orderOrId?.id;
}

function toOrderView(order) {
  if (!order) return null;
  const items = Array.isArray(order.items) ? order.items : [];
  const id = apiOrderId(order);
  const tableName = order.tableName || `Mesa ${order.table ?? order.tableId ?? 'sin asignar'}`;
  const products = items.length
    ? items.map((item) => `${item.quantity} ${item.name || item.product || 'producto'}`).join(', ')
    : 'Detalle pendiente de sincronizar';
  const total = Number(order.total || 0);
  const statusType = order.statusType || 'pending';
  const raw = order.raw || {};

  return {
    ...order,
    action: 'Ver detalle',
    actionType: 'detail',
    amount: formatCurrency(total),
    apiId: id,
    cashierStatus: statusType === 'paid' ? 'paid' : statusType === 'cancelled' ? 'cancelled' : 'pending',
    detail: `${tableName} · ${products}`,
    id: `Pedido #${order.orderNumber ?? id}`,
    kitchenStage: statusType === 'kitchen' ? 'preparing' : statusType === 'ready' ? 'ready' : 'queue',
    notes: order.notes || 'Sin observaciones.',
    kitchenNote: order.kitchenNote || null,
    kitchenDelayReportedAt: order.kitchenDelayReportedAt || null,
    paidAt: order.paidAt,
    paymentMethod: raw.metodo_pago ?? raw.payment_method ?? raw.paymentMethod ?? null,
    productItems: items.map((item) => ({
      discount: Number(item.discount || 0),
      id: item.id,
      name: item.name || item.product || 'Producto',
      price: Number(item.unitPrice || 0),
      promotionId: item.promotionId || null,
      quantity: Number(item.quantity || 0),
      total: Number(item.subtotal || 0),
    })),
    products,
    servedBy: raw.usuario?.nombre_completo || raw.user?.name || 'Mesero',
    status: order.state || raw.estado || 'Pendiente',
    statusType,
    stepsDone: statusSteps[statusType] || 1,
    subtotal: total,
    table: tableName,
    tax: 0,
    total,
  };
}

function mergeOrderViews(...queues) {
  const merged = new Map();
  queues.flat().filter(Boolean).forEach((order) => {
    const view = toOrderView(order);
    if (!view) return;
    const current = merged.get(String(view.apiId));
    merged.set(String(view.apiId), current ? { ...current, ...view } : view);
  });
  return [...merged.values()].sort((left, right) => Number(right.apiId || 0) - Number(left.apiId || 0));
}

function categoryIcon(category = '') {
  const normalized = String(category).toLowerCase();
  if (normalized.includes('bebida') || normalized.includes('café') || normalized.includes('cafe')) return '☕';
  if (normalized.includes('pan') || normalized.includes('postre')) return '🥐';
  if (normalized.includes('combo')) return '🍳';
  return '🍽️';
}

function toMenuView(product) {
  return {
    active: Boolean(product.active),
    available: Boolean(product.active && product.stock > 0),
    category: product.category || 'General',
    categoryId: product.categoryId,
    description: product.description || 'Producto del menú',
    featured: false,
    icon: categoryIcon(product.category),
    id: product.id,
    imageUrl: product.imageUrl,
    name: product.name,
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    type: 'Platillo',
  };
}

function toInventoryView(item) {
  return {
    category: item.categoria || 'General',
    icon: categoryIcon(item.categoria),
    id: item.id_insumo ?? item.id,
    minimum: Number(item.stock_minimo || 0),
    name: item.nombre || '',
    quantity: Number(item.stock_actual || 0),
    unit: item.unidad_medida || 'piezas',
    updatedAt: item.actualizado_en || 'Sincronizado',
  };
}

function toExpenseView(item) {
  return {
    amount: Number(item.monto || 0),
    category: item.categoria || 'Otro',
    createdAt: item.fecha || item.creado_en || item.createdAt || null,
    description: item.descripcion || '',
    id: item.id_gasto ?? item.id,
  };
}

function toPurchaseView(item) {
  const detail = item.detalles?.[0] || {};
  const supply = detail.insumo || {};
  const quantity = Number(detail.cantidad || 0);
  const received = item.estado === 'Recibida';
  const cancelled = item.estado === 'Cancelada';
  return {
    amount: Number(item.total || 0),
    createdAt: item.fecha || item.creado_en || item.createdAt || null,
    detail: `${quantity} ${supply.unidad_medida || 'piezas'} · ${item.estado || 'Pendiente'}`,
    icon: categoryIcon(supply.nombre),
    id: item.id_compra ?? item.id,
    inventoryItemId: detail.id_insumo,
    name: supply.nombre || item.proveedor || 'Compra',
    quantity: String(quantity),
    raw: item,
    status: received ? 'Registrada' : item.estado || 'Pendiente',
    type: received ? 'paid' : cancelled ? 'cancelled' : 'pending',
    unit: supply.unidad_medida || 'piezas',
    urgent: false,
  };
}

function toNotificationEvent(item) {
  return {
    apiId: item.id_notificacion ?? item.id,
    createdAt: item.creado_en || 'Ahora',
    detail: item.mensaje || item.descripcion || '',
    icon: item.severidad === 'warning' ? '⚠️' : item.severidad === 'success' ? '✅' : 'ℹ️',
    id: `notification-${item.id_notificacion ?? item.id}`,
    module: item.tipo || 'Sistema',
    severity: item.severidad || 'info',
    title: item.titulo || 'Notificación',
    type: 'notification',
    read: Boolean(item.leida),
  };
}

function toActivityEvent(item) {
  return {
    createdAt: item.creado_en || 'Ahora',
    detail: item.descripcion || '',
    icon: item.severidad === 'warning' ? '⚠️' : '📝',
    id: `activity-${item.id_evento ?? item.id}`,
    module: item.modulo || 'Sistema',
    severity: item.severidad || 'info',
    title: item.accion || 'Actividad',
    type: 'activity',
  };
}

function toPromotionView(item) {
  const product = item.producto || {};
  const basePrice = Number(product.precio || 0);
  const value = Number(item.valor || 0);
  const price = item.tipo === 'Precio fijo'
    ? value
    : item.tipo === 'Porcentaje'
      ? Math.max(0, basePrice * (1 - value / 100))
      : Math.max(0, basePrice - value);
  return {
    active: Boolean(item.activo),
    badge: 'Activa',
    badgeType: 'active',
    detail: item.descripcion || product.nombre || 'Promoción vigente',
    featured: true,
    id: item.id_promocion,
    description: item.descripcion || '',
    endAt: item.fecha_fin,
    label: 'Precio promoción',
    orderItem: product.id_producto ? {
      icon: categoryIcon(product.nombre),
      menuId: product.id_producto,
      name: product.nombre,
      price,
      promotionId: item.id_promocion,
    } : null,
    productId: product.id_producto || item.id_producto || null,
    raw: item,
    startAt: item.fecha_inicio,
    title: item.nombre,
    type: item.tipo,
    numericValue: value,
    value: formatCurrency(price || value),
  };
}

export default function App() {
  return (
    <SessionProvider>
      <CoffeeAdminApp />
    </SessionProvider>
  );
}

function CoffeeAdminApp() {
  const {
    authError,
    currentRole: sessionRole,
    currentRoleId: sessionRoleId,
    isAuthenticated,
    isBootstrapping,
    isLoading: isLoginLoading,
    login,
    logout,
    updateProfile: updateSessionProfile,
    userProfile: sessionUserProfile,
  } = useSession();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [screen, setScreen] = useState('login');
  const [history, setHistory] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerDraft, setCustomerDraft] = useState(emptyCustomerDraft);
  const [cashierExpenses, setCashierExpenses] = useState([]);
  const [cashierPurchases, setCashierPurchases] = useState([]);
  const [kitchenInventory, setKitchenInventory] = useState([]);
  const [kitchenMenuItems, setKitchenMenuItems] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [userProfile, setUserProfile] = useState(initialUserProfile);
  const [appSettings, setAppSettings] = useState(initialAppSettings);
  const [systemEvents, setSystemEvents] = useState([]);
  const [selectedCashierOrderId, setSelectedCashierOrderId] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const refreshInFlight = useRef(false);
  const theme = isDarkMode ? themes.dark : themes.light;
  const currentRoleId = sessionRoleId || 'admin';
  const currentRole = { ...(roleMap[currentRoleId] || roleMap.admin), ...(sessionRole || {}) };
  const clearDomainState = useCallback(() => {
    setCustomerOrders([]);
    setCustomerDraft(emptyCustomerDraft);
    setCashierExpenses([]);
    setCashierPurchases([]);
    setKitchenInventory([]);
    setKitchenMenuItems([]);
    setAvailableTables([]);
    setCategories([]);
    setPromotions([]);
    setSystemEvents([]);
    setSelectedCashierOrderId(null);
    setSyncError(null);
  }, []);

  useEffect(() => {
    if (sessionUserProfile) {
      setUserProfile((currentProfile) => ({ ...currentProfile, ...sessionUserProfile }));
    }
  }, [sessionUserProfile]);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      if (screen !== 'serverConfig') {
        setHistory([]);
        setScreen('login');
        clearDomainState();
      }
    } else if (screen === 'login' && !isLoginLoading) {
      setScreen((roleMap[sessionRoleId] || roleMap.admin).defaultScreen);
    }
  }, [clearDomainState, isAuthenticated, isBootstrapping, isLoginLoading, screen, sessionRoleId]);

  const refreshData = useCallback(async ({ silent = false } = {}) => {
    if (!isAuthenticated || refreshInFlight.current) return;

    refreshInFlight.current = true;
    if (!silent) setIsSyncing(true);

    try {
      const orderRequests = [];
      const role = sessionRoleId;

      const productsPromise = productoService.list({ activo: true });
      const tablesPromise = ['waiter', 'admin'].includes(role) ? mesaService.list() : Promise.resolve(null);

      if (['waiter', 'admin'].includes(role)) orderRequests.push(pedidoService.list());
      if (['kitchen', 'admin'].includes(role)) orderRequests.push(cocinaService.listOrders());
      if (['cashier', 'admin'].includes(role)) {
        orderRequests.push(cajaService.listOrders());
        orderRequests.push(cajaService.listHistory({ includeCancelled: true, limit: 200 }));
      }

      const [productsResult, tablesResult, ...orderResults] = await Promise.allSettled([
        productsPromise,
        tablesPromise,
        ...orderRequests,
      ]);

      const failures = [productsResult, tablesResult, ...orderResults].filter((result) => result.status === 'rejected');

      if (productsResult.status === 'fulfilled') {
        setKitchenMenuItems((productsResult.value || []).map(toMenuView));
      }
      if (tablesResult.status === 'fulfilled' && tablesResult.value) {
        setAvailableTables(tablesResult.value.filter((table) => table.available));
      }

      const orderQueues = orderResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value || []);
      if (orderQueues.length) setCustomerOrders(mergeOrderViews(...orderQueues));

      const domainRequests = [];
      const domainKeys = [];
      const addDomainRequest = (key, promise) => {
        domainKeys.push(key);
        domainRequests.push(promise);
      };

      if (['kitchen', 'cashier', 'admin'].includes(role)) {
        addDomainRequest('inventory', inventarioService.list());
      }
      if (['kitchen', 'admin'].includes(role)) {
        addDomainRequest('categories', categoriaService.list());
      }
      if (['cashier', 'admin'].includes(role)) {
        addDomainRequest('purchases', compraService.list());
        addDomainRequest('expenses', gastoService.list());
      }
      addDomainRequest('notifications', notificacionService.list());
      addDomainRequest('promotions', promocionService.listActive());
      addDomainRequest('preferences', preferenciaService.get());
      if (role === 'admin') addDomainRequest('activity', actividadService.list());

      const domainResults = await Promise.allSettled(domainRequests);
      domainResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          failures.push(result);
          return;
        }

        const key = domainKeys[index];
        const value = result.value;
        if (key === 'inventory') setKitchenInventory((value || []).map(toInventoryView));
        if (key === 'categories') setCategories(value || []);
        if (key === 'purchases') setCashierPurchases((value || []).map(toPurchaseView));
        if (key === 'expenses') setCashierExpenses((value || []).map(toExpenseView));
        if (key === 'notifications') {
          setSystemEvents((current) => [
            ...(value || []).map(toNotificationEvent),
            ...current.filter((event) => event.type !== 'notification'),
          ].slice(0, 80));
        }
        if (key === 'promotions') {
          setPromotions((value || []).map(toPromotionView).filter((item) => item.orderItem));
        }
        if (key === 'activity') {
          setSystemEvents((current) => [
            ...current.filter((event) => event.type !== 'activity'),
            ...(value || []).map(toActivityEvent),
          ].slice(0, 80));
        }
        if (key === 'preferences') {
          const remoteSettings = Array.isArray(value)
            ? Object.fromEntries(value.map((item) => [item.clave, item.valor]))
            : value || {};
          setAppSettings((current) => ({ ...current, ...normalizeRemoteSettings(remoteSettings) }));
        }
      });

      if (failures.length) {
        setSyncError(failures[0].reason);
      } else {
        setSyncError(null);
      }
    } finally {
      refreshInFlight.current = false;
      if (!silent) setIsSyncing(false);
    }
  }, [isAuthenticated, sessionRoleId]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    refreshData();
    if (!appSettings.autoSync) return undefined;
    const timer = setInterval(() => refreshData({ silent: true }), 8000);
    return () => clearInterval(timer);
  }, [appSettings.autoSync, isAuthenticated, refreshData]);

  const canAccessScreen = (target, role = currentRole) => role.allowedScreens.includes(target);

  const navigate = (target) => {
    if (target === screen) {
      return;
    }

    if (target === 'login') {
      logout().finally(() => {
        setHistory([]);
        setScreen('login');
        clearDomainState();
      });
      return;
    }

    if (!canAccessScreen(target)) {
      setHistory((currentHistory) => [...currentHistory, screen]);
      setScreen(currentRole.defaultScreen);
      return;
    }

    setHistory((currentHistory) => [...currentHistory, screen]);
    setScreen(target);
  };

  const goBack = () => {
    setHistory((currentHistory) => {
      const previousScreen = currentHistory[currentHistory.length - 1] || 'dashboard';
      setScreen(previousScreen);
      return currentHistory.slice(0, -1);
    });
  };

  const recordEvent = (event) => {
    setSystemEvents((currentEvents) => [
      {
        createdAt: 'Ahora',
        id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        severity: 'info',
        type: 'activity',
        ...event,
      },
      ...currentEvents,
    ].slice(0, 80));
  };

  const handleLogin = async (email, password) => {
    const nextSession = await login(email, password);
    const nextRole = roleMap[nextSession?.role] || roleMap.admin;
    setHistory([]);
    setScreen(nextRole.defaultScreen);
    recordEvent({
      detail: `${nextSession?.user?.name || email} inició sesión como ${nextRole.label}.`,
      icon: nextRole.icon,
      module: 'Sistema',
      severity: 'info',
      title: 'Inicio de sesión',
      type: 'activity',
    });
    return nextSession;
  };

  const addCustomerOrder = async (order) => {
    const created = await pedidoService.createComplete({
      items: order.items,
      notes: order.observations,
      tableId: order.tableId,
    });
    const orderView = toOrderView(created);
    setCustomerOrders((currentOrders) => mergeOrderViews(orderView, currentOrders));
    recordEvent({
      detail: `${orderView.id} levantado para ${orderView.table} por ${orderView.amount}.`,
      icon: '🧾',
      module: 'Cliente / Mesero',
      severity: 'info',
      title: 'Pedido creado',
      type: 'notification',
    });
    await refreshData({ silent: true });
    return orderView;
  };

  const updateCustomerOrder = (orderId, updater) => {
    setCustomerOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === orderId ? updater(order) : order)),
    );
  };

  const replaceApiOrder = (apiOrder) => {
    const nextOrder = toOrderView(apiOrder);
    setCustomerOrders((currentOrders) => mergeOrderViews(nextOrder, currentOrders));
    return nextOrder;
  };

  const prepareOrder = async (orderId) => {
    const updated = replaceApiOrder(await cocinaService.startPreparation(apiOrderId(orderId)));
    await refreshData({ silent: true });
    return updated;
  };

  const markOrderReady = async (orderId) => {
    const updated = replaceApiOrder(await cocinaService.markReady(apiOrderId(orderId)));
    await refreshData({ silent: true });
    return updated;
  };

  const reportKitchenDelay = async (orderId, note) => {
    const updated = replaceApiOrder(await cocinaService.reportDelay(apiOrderId(orderId), note));
    await refreshData({ silent: true });
    return updated;
  };

  const chargeOrder = async (orderId, payment) => {
    const updated = replaceApiOrder(await cajaService.charge(apiOrderId(orderId), {
      amountReceived: payment?.amountReceived,
      method: payment?.paymentMethod || payment?.method || 'Efectivo',
      reference: payment?.reference,
    }));
    await refreshData({ silent: true });
    return updated;
  };

  const cancelOrder = async (orderId) => {
    const updated = replaceApiOrder(await pedidoService.cancel(apiOrderId(orderId)));
    await refreshData({ silent: true });
    return updated;
  };

  const markNotificationRead = async (notificationId) => {
    const id = typeof notificationId === 'object' ? notificationId.apiId : notificationId;
    if (!id) return;
    try {
      await notificacionService.markRead(id);
      setSystemEvents((events) => events.map((event) =>
        String(event.apiId) === String(id) ? { ...event, read: true } : event,
      ));
    } catch (error) {
      showMutationError('No se pudo marcar la notificación', error);
    }
  };

  const openCashierOrderDetail = (orderId) => {
    setSelectedCashierOrderId(orderId);
    navigate('cashierOrderDetail');
  };

  const updateCustomerDraft = (updater) => {
    setCustomerDraft((currentDraft) => updater(currentDraft));
  };

  const resetCustomerDraft = () => {
    setCustomerDraft(emptyCustomerDraft);
  };

  const addMarketingItemToDraft = (item) => {
    setCustomerDraft((currentDraft) => {
      const productExists = currentDraft.products.some((product) => product.name === item.name);
      const products = productExists
        ? currentDraft.products.map((product) =>
            product.name === item.name ? { ...product, ...item, quantity: product.quantity + 1 } : product,
          )
        : [...currentDraft.products, { ...item, quantity: 1 }];
      const note = `Sugerido por marketing: ${item.name}.`;
      const hasNote = currentDraft.observations.includes(note);

      return {
        ...currentDraft,
        observations: hasNote ? currentDraft.observations : `${currentDraft.observations}\n${note}`.trim(),
        products,
      };
    });
  };

  const showMutationError = (title, error) => {
    setSyncError(error);
    Alert.alert(title, error?.userMessage || error?.message || 'No se pudo completar la operación.');
  };

  const addCashierExpense = async (expense) => {
    try {
      const created = await gastoService.create({
        categoria: expense.category,
        descripcion: expense.description,
        monto: Number(expense.amount || 0),
      });
      const view = toExpenseView(created);
      setCashierExpenses((currentExpenses) => [view, ...currentExpenses]);
      return view;
    } catch (error) {
      showMutationError('No se pudo registrar el gasto', error);
      return null;
    }
  };

  const updateCashierExpense = async (expenseId, updater) => {
    const current = cashierExpenses.find((expense) => String(expense.id) === String(expenseId));
    if (!current) return null;
    const next = updater(current);
    try {
      const updated = await gastoService.update(expenseId, {
        categoria: next.category,
        descripcion: next.description,
        monto: Number(next.amount || 0),
      });
      const view = toExpenseView(updated);
      setCashierExpenses((items) => items.map((item) => (String(item.id) === String(expenseId) ? view : item)));
      return view;
    } catch (error) {
      showMutationError('No se pudo actualizar el gasto', error);
      return null;
    }
  };

  const deleteCashierExpense = async (expenseId) => {
    try {
      await gastoService.remove(expenseId);
      setCashierExpenses((items) => items.filter((item) => String(item.id) !== String(expenseId)));
      return true;
    } catch (error) {
      showMutationError('No se pudo eliminar el gasto', error);
      return null;
    }
  };

  const ensureSupply = async (purchase) => {
    const existing = kitchenInventory.find((item) =>
      String(item.id) === String(purchase.inventoryItemId) ||
      item.name.toLowerCase() === String(purchase.name || '').toLowerCase(),
    );
    if (existing) return existing;
    if (currentRoleId !== 'admin') {
      throw new Error('Selecciona un insumo existente; solo Administración puede crear insumos desde Compras.');
    }
    const created = await inventarioService.create({
      activo: true,
      categoria: 'Compras',
      nombre: purchase.name,
      stock_inicial: 0,
      stock_minimo: 0,
      unidad_medida: purchase.unit || 'piezas',
    });
    const view = toInventoryView(created);
    setKitchenInventory((items) => [view, ...items]);
    return view;
  };

  const purchasePayload = async (purchase) => {
    const supply = await ensureSupply(purchase);
    const quantity = Number(purchase.quantity || 0);
    return {
      detalles: [{
        cantidad: quantity,
        costo_unitario: quantity > 0 ? Number(purchase.amount || 0) / quantity : 0,
        id_insumo: supply.id,
      }],
      estado: purchase.type === 'paid' ? 'Recibida' : 'Pendiente',
      observaciones: purchase.urgent ? 'Compra urgente solicitada desde móvil.' : 'Registrada desde la aplicación móvil.',
      proveedor: purchase.provider || 'Compra móvil',
    };
  };

  const addCashierPurchase = async (purchase) => {
    try {
      const created = await compraService.create(await purchasePayload(purchase));
      const view = toPurchaseView(created);
      setCashierPurchases((items) => [view, ...items]);
      return view;
    } catch (error) {
      showMutationError('No se pudo registrar la compra', error);
      return null;
    }
  };

  const updateCashierPurchase = async (purchaseId, updater) => {
    const current = cashierPurchases.find((purchase) => String(purchase.id) === String(purchaseId));
    if (!current) return null;
    const next = updater(current);
    try {
      const updated = await compraService.update(purchaseId, await purchasePayload(next));
      const view = toPurchaseView(updated);
      setCashierPurchases((items) => items.map((item) => (String(item.id) === String(purchaseId) ? view : item)));
      return view;
    } catch (error) {
      showMutationError('No se pudo actualizar la compra', error);
      return null;
    }
  };

  const deleteCashierPurchase = async (purchaseId) => {
    try {
      const updated = await compraService.update(purchaseId, { estado: 'Cancelada' });
      const view = toPurchaseView(updated);
      setCashierPurchases((items) => items.map((item) => (String(item.id) === String(purchaseId) ? view : item)));
      return view;
    } catch (error) {
      showMutationError('No se pudo cancelar la compra', error);
      return null;
    }
  };

  const addKitchenInventoryItem = async (item) => {
    try {
      const created = await inventarioService.create({
        activo: true,
        categoria: item.category,
        nombre: item.name,
        stock_inicial: Number(item.quantity || 0),
        stock_minimo: Number(item.minimum || 0),
        unidad_medida: item.unit,
      });
      const view = toInventoryView(created);
      setKitchenInventory((items) => [view, ...items]);
      return view;
    } catch (error) {
      showMutationError('No se pudo agregar el insumo', error);
      return null;
    }
  };

  const updateKitchenInventoryItem = async (itemId, updater) => {
    const current = kitchenInventory.find((item) => String(item.id) === String(itemId));
    if (!current) return null;
    const next = updater(current);
    try {
      await inventarioService.update(itemId, {
        categoria: next.category,
        nombre: next.name,
        stock_minimo: Number(next.minimum || 0),
        unidad_medida: next.unit,
      });
      if (Number(next.quantity) !== Number(current.quantity)) {
        await inventarioService.addMovement(itemId, {
          cantidad: Number(next.quantity || 0),
          motivo: 'Ajuste desde la aplicación móvil',
          referencia: 'mobile',
          tipo: 'Ajuste',
        });
      }
      const updated = toInventoryView(await inventarioService.get(itemId));
      setKitchenInventory((items) => items.map((item) => (String(item.id) === String(itemId) ? updated : item)));
      return updated;
    } catch (error) {
      showMutationError('No se pudo actualizar el inventario', error);
      return null;
    }
  };

  const deleteKitchenInventoryItem = async (itemId) => {
    try {
      await inventarioService.remove(itemId);
      setKitchenInventory((items) => items.filter((item) => String(item.id) !== String(itemId)));
      return true;
    } catch (error) {
      showMutationError('No se pudo eliminar el insumo', error);
      return null;
    }
  };

  const resolveCategoryId = (item) => {
    const category = categories.find((entry) =>
      String(entry.id_categoria ?? entry.id) === String(item.categoryId) ||
      String(entry.nombre || entry.name).toLowerCase() === String(item.category || '').toLowerCase(),
    );
    return category?.id_categoria ?? category?.id ?? categories[0]?.id_categoria ?? categories[0]?.id;
  };

  const addKitchenMenuItem = async (item) => {
    try {
      const categoryId = resolveCategoryId(item);
      if (!categoryId) throw new Error('Primero crea una categoría de productos desde administración.');
      const created = await productoService.create({
        active: item.active ?? item.available,
        categoryId,
        description: item.description,
        name: item.name,
        price: Number(item.price || 0),
        stock: Number(item.stock || 100),
      });
      const view = toMenuView(created);
      setKitchenMenuItems((items) => [view, ...items]);
      return view;
    } catch (error) {
      showMutationError('No se pudo agregar el producto', error);
      return null;
    }
  };

  const updateKitchenMenuItem = async (itemId, updater) => {
    const current = kitchenMenuItems.find((item) => String(item.id) === String(itemId));
    if (!current) return null;
    const next = updater(current);
    try {
      const updated = await productoService.update(itemId, {
        active: next.active ?? next.available,
        categoryId: resolveCategoryId(next),
        description: next.description,
        name: next.name,
        price: Number(next.price || 0),
        stock: Number(next.stock || current.stock || 0),
      });
      const view = toMenuView(updated);
      setKitchenMenuItems((items) => items.map((item) => (String(item.id) === String(itemId) ? view : item)));
      return view;
    } catch (error) {
      showMutationError('No se pudo actualizar el producto', error);
      return null;
    }
  };

  const deleteKitchenMenuItem = async (itemId) => {
    try {
      await productoService.remove(itemId);
      setKitchenMenuItems((items) => items.filter((item) => String(item.id) !== String(itemId)));
      setCustomerDraft((currentDraft) => ({
        ...currentDraft,
        products: currentDraft.products.filter((product) => product.menuId !== itemId),
      }));
      return true;
    } catch (error) {
      showMutationError('No se pudo eliminar el producto', error);
      return null;
    }
  };

  const addPromotion = async (promotion) => {
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + 30);
    try {
      const created = await promocionService.create({
        activo: true,
        descripcion: promotion.description || null,
        fecha_fin: endsAt.toISOString(),
        fecha_inicio: startsAt.toISOString(),
        id_producto: Number(promotion.productId),
        nombre: promotion.name,
        tipo: promotion.type,
        valor: Number(promotion.value),
      });
      const view = toPromotionView(created);
      setPromotions((items) => [view, ...items]);
      return view;
    } catch (error) {
      showMutationError('No se pudo crear la promoción', error);
      return null;
    }
  };

  const updatePromotion = async (promotionId, promotion) => {
    try {
      const updated = await promocionService.update(promotionId, {
        descripcion: promotion.description || null,
        id_producto: Number(promotion.productId),
        nombre: promotion.name,
        tipo: promotion.type,
        valor: Number(promotion.value),
      });
      const view = toPromotionView(updated);
      setPromotions((items) => items.map((item) => (String(item.id) === String(promotionId) ? view : item)));
      return view;
    } catch (error) {
      showMutationError('No se pudo actualizar la promoción', error);
      return null;
    }
  };

  const deletePromotion = async (promotionId) => {
    try {
      await promocionService.remove(promotionId);
      setPromotions((items) => items.filter((item) => String(item.id) !== String(promotionId)));
      return true;
    } catch (error) {
      showMutationError('No se pudo desactivar la promoción', error);
      return null;
    }
  };

  const updateUserProfile = async (updater) => {
    const next = updater(userProfile);
    try {
      const updated = await updateSessionProfile({
        email: next.email,
        name: next.name,
      });
      if (!updated) return null;
      const profile = {
        ...next,
        email: updated.email,
        name: updated.name,
      };
      setUserProfile(profile);
      return profile;
    } catch (error) {
      showMutationError('No se pudo actualizar el perfil', error);
      return null;
    }
  };

  const updateAppSetting = (key, value) => {
    setAppSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
    if (currentRoleId === 'admin') {
      preferenciaService.update({ [key]: value }).catch((error) => {
        showMutationError('No se pudo guardar la configuración', error);
      });
    }
  };

  const sharedProps = {
    appSettings,
    authError,
    availableTables,
    canCancelOrders: ['waiter', 'admin'].includes(currentRoleId),
    cancelOrder,
    chargeOrder,
    systemEvents,
    recordEvent,
    addCustomerOrder,
    addCashierExpense,
    addCashierPurchase,
    addKitchenInventoryItem,
    addKitchenMenuItem,
    addPromotion,
    addMarketingItemToDraft,
    cashierExpenses,
    cashierPurchases,
    categories,
    customerDraft,
    customerOrders,
    currentRole,
    currentRoleId,
    deleteCashierExpense,
    deleteCashierPurchase,
    deleteKitchenInventoryItem,
    deleteKitchenMenuItem,
    deletePromotion,
    goBack,
    isDarkMode,
    isLoginLoading,
    isSyncing,
    kitchenInventory,
    kitchenMenuItems,
    login: handleLogin,
    markOrderReady,
    markNotificationRead,
    navigate,
    openCashierOrderDetail,
    resetCustomerDraft,
    refreshData,
    roleOptions,
    selectedCashierOrderId,
    setSelectedCashierOrderId,
    setIsDarkMode,
    syncError,
    theme,
    updateAppSetting,
    updateCashierExpense,
    updateCashierPurchase,
    updateCustomerDraft,
    updateCustomerOrder,
    updateKitchenInventoryItem,
    updateKitchenMenuItem,
    updatePromotion,
    updateUserProfile,
    userProfile,
    prepareOrder,
    reportKitchenDelay,
    promotions,
    recommendedProducts: kitchenMenuItems.filter((item) => item.available),
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.app, { backgroundColor: theme.background }]}>
        <StatusBar hidden style={theme.statusBar} />

        {screen === 'login' && <LoginScreen {...sharedProps} />}
        {screen === 'serverConfig' && <ServerConfigScreen {...sharedProps} />}
        {screen === 'dashboard' && <DashboardScreen {...sharedProps} />}
        {screen === 'activity' && <ActivityScreen {...sharedProps} />}
        {screen === 'cashier' && <CashierScreen {...sharedProps} />}
        {screen === 'cashierAccounts' && <CashierAccountsScreen {...sharedProps} />}
        {screen === 'cashierOrderDetail' && <CashierOrderDetailScreen {...sharedProps} />}
        {screen === 'cashierOrders' && <CashierOrdersScreen {...sharedProps} />}
        {screen === 'cashierPurchases' && <CashierPurchasesScreen {...sharedProps} />}
        {screen === 'customer' && <CustomerScreen {...sharedProps} />}
        {screen === 'customerMarketing' && <CustomerMarketingScreen {...sharedProps} />}
        {screen === 'customerOrder' && <CustomerOrderScreen {...sharedProps} />}
        {screen === 'customerOrders' && <CustomerOrdersScreen {...sharedProps} />}
        {screen === 'help' && <HelpScreen {...sharedProps} />}
        {screen === 'kitchen' && <KitchenScreen {...sharedProps} />}
        {screen === 'kitchenInventory' && <KitchenInventoryScreen {...sharedProps} />}
        {screen === 'kitchenMenu' && <KitchenMenuScreen {...sharedProps} />}
        {screen === 'kitchenOrders' && <KitchenOrdersScreen {...sharedProps} />}
        {screen === 'notifications' && <NotificationsScreen {...sharedProps} />}
        {screen === 'profile' && <ProfileScreen {...sharedProps} />}
        {screen === 'settings' && <SettingsScreen {...sharedProps} />}

        {!['login', 'serverConfig'].includes(screen) && (
          <BottomNav
            active={getBottomNavActiveScreen(screen)}
            currentRoleId={currentRoleId}
            isDarkMode={isDarkMode}
            navigate={navigate}
            theme={theme}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function getBottomNavActiveScreen(screen) {
  if (['cashierAccounts', 'cashierPurchases'].includes(screen)) return 'cashier';
  if (screen === 'cashierOrderDetail') return 'cashierOrders';
  if (screen === 'kitchenMenu') return 'kitchen';
  if (['help', 'settings'].includes(screen)) return 'profile';
  return screen;
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
});
