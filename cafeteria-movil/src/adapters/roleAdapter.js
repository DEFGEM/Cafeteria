function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const ALL_ROLE_SCREENS = [
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
  'settings',
];

export const ROLE_DEFINITIONS = Object.freeze({
  waiter: Object.freeze({
    id: 'waiter',
    apiRole: 'mesero',
    icon: '🧍',
    label: 'Mesero',
    description: 'Pedidos, mesas y promociones',
    defaultScreen: 'dashboard',
    moduleTargets: ['customer'],
    drawerTargets: ['dashboard', 'customer', 'notifications', 'activity', 'profile', 'settings', 'help'],
    allowedScreens: ['dashboard', 'customer', 'customerMarketing', 'customerOrder', 'customerOrders', 'notifications', 'activity', 'profile', 'settings', 'help', 'login'],
  }),
  kitchen: Object.freeze({
    id: 'kitchen',
    apiRole: 'cocina',
    icon: '👨‍🍳',
    label: 'Cocina',
    description: 'Pedidos, inventario y menú',
    defaultScreen: 'dashboard',
    moduleTargets: ['kitchen', 'kitchenInventory'],
    drawerTargets: ['dashboard', 'kitchen', 'notifications', 'activity', 'profile', 'settings', 'help'],
    allowedScreens: ['dashboard', 'kitchen', 'kitchenInventory', 'kitchenMenu', 'kitchenOrders', 'notifications', 'activity', 'profile', 'settings', 'help', 'login'],
  }),
  cashier: Object.freeze({
    id: 'cashier',
    apiRole: 'caja',
    icon: '💵',
    label: 'Cajero',
    description: 'Pagos, cuentas y compras',
    defaultScreen: 'dashboard',
    moduleTargets: ['cashier'],
    drawerTargets: ['dashboard', 'cashier', 'notifications', 'activity', 'profile', 'settings', 'help'],
    allowedScreens: ['dashboard', 'cashier', 'cashierAccounts', 'cashierOrderDetail', 'cashierOrders', 'cashierPurchases', 'notifications', 'activity', 'profile', 'settings', 'help', 'login'],
  }),
  admin: Object.freeze({
    id: 'admin',
    apiRole: 'administrador',
    icon: '☕',
    label: 'Administrador',
    description: 'Acceso completo al sistema',
    defaultScreen: 'dashboard',
    moduleTargets: ['customer', 'cashier', 'kitchen', 'kitchenInventory'],
    drawerTargets: ['dashboard', 'customer', 'cashier', 'kitchen', 'notifications', 'activity', 'profile', 'settings', 'help'],
    allowedScreens: ALL_ROLE_SCREENS,
  }),
});

const API_TO_MOBILE_ROLE = Object.freeze({
  mesero: 'waiter',
  waiter: 'waiter',
  cocina: 'kitchen',
  kitchen: 'kitchen',
  caja: 'cashier',
  cajero: 'cashier',
  cashier: 'cashier',
  administrador: 'admin',
  admin: 'admin',
});

export function toMobileRole(role) {
  const source = role?.id ?? role?.apiRole ?? role?.nombre ?? role?.name ?? role?.rol ?? role?.role ?? role;
  return API_TO_MOBILE_ROLE[normalize(source)] ?? null;
}

export function toApiRole(role) {
  const mobileRole = toMobileRole(role);
  return mobileRole ? ROLE_DEFINITIONS[mobileRole].apiRole : null;
}

export function getRoleDefinition(role) {
  const mobileRole = toMobileRole(role);
  return mobileRole ? ROLE_DEFINITIONS[mobileRole] : null;
}

export function adaptUser(rawUser, fallback = {}) {
  const source = typeof rawUser === 'object' && rawUser !== null ? rawUser : {};
  const nestedRole = source.rol?.nombre ?? source.rol?.name ?? source.rol;
  const roleSource = nestedRole ?? source.role ?? fallback.role ?? fallback.rol;
  const role = toMobileRole(roleSource);

  return {
    id: source.id_usuario ?? source.id ?? fallback.id ?? null,
    name: source.nombre_completo ?? source.nombre ?? source.name ?? fallback.name ?? (typeof rawUser === 'string' ? rawUser : ''),
    email: source.email ?? fallback.email ?? '',
    phone: source.telefono ?? source.phone ?? fallback.phone ?? '',
    shift: source.turno ?? source.shift ?? fallback.shift ?? '',
    active: source.activo ?? source.active ?? true,
    roleId: source.id_rol ?? source.roleId ?? source.rol?.id_rol ?? source.role?.id ?? null,
    role,
    apiRole: toApiRole(roleSource),
    raw: rawUser,
  };
}

export function adaptAuthSession(payload, fallback = {}) {
  const accessToken = payload?.access_token ?? payload?.accessToken ?? fallback.accessToken;
  const rawUser = payload?.user ?? payload?.usuario ?? fallback.user;
  const roleSource = payload?.rol ?? payload?.role ?? rawUser?.rol ?? rawUser?.role ?? fallback.role;
  const user = adaptUser(rawUser, {
    email: fallback.email,
    role: roleSource,
    name: typeof payload?.usuario === 'string' ? payload.usuario : fallback.name,
  });
  const role = user.role ?? toMobileRole(roleSource);

  return {
    accessToken,
    tokenType: payload?.token_type ?? payload?.tokenType ?? 'bearer',
    role,
    user: {
      ...user,
      role,
      apiRole: toApiRole(role),
    },
    authenticatedAt: fallback.authenticatedAt ?? new Date().toISOString(),
  };
}
