import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';

const defaultItems = [
  { icon: 'home-outline', activeIcon: 'home', label: 'Inicio', target: 'dashboard' },
  { icon: 'restaurant-outline', activeIcon: 'restaurant', label: 'Cocina', target: 'kitchen' },
  { icon: 'cube-outline', activeIcon: 'cube', label: 'Stock', target: 'kitchenInventory' },
  { icon: 'person-outline', activeIcon: 'person', label: 'Perfil', target: 'profile' },
];

const cashierItems = [
  { icon: 'home-outline', activeIcon: 'home', label: 'Inicio', target: 'dashboard' },
  { icon: 'cash-outline', activeIcon: 'cash', label: 'Caja', target: 'cashier' },
  { icon: 'receipt-outline', activeIcon: 'receipt', label: 'Pedidos', target: 'cashierOrders' },
  { icon: 'person-outline', activeIcon: 'person', label: 'Perfil', target: 'profile' },
];

const customerItems = [
  { icon: 'home-outline', activeIcon: 'home', label: 'Inicio', target: 'dashboard' },
  { icon: 'create-outline', activeIcon: 'create', label: 'Pedido', target: 'customerOrder' },
  { icon: 'document-text-outline', activeIcon: 'document-text', label: 'Pedidos', target: 'customerOrders' },
  { icon: 'person-outline', activeIcon: 'person', label: 'Perfil', target: 'profile' },
];

const customerOrderItems = [
  { icon: 'home-outline', activeIcon: 'home', label: 'Inicio', target: 'customer' },
  { icon: 'create-outline', activeIcon: 'create', label: 'Pedido', target: 'customerOrder' },
  { icon: 'receipt-outline', activeIcon: 'receipt', label: 'Mis pedidos', target: 'customerOrders' },
  { icon: 'person-outline', activeIcon: 'person', label: 'Perfil', target: 'profile' },
];

export default function BottomNav({ active, currentRoleId, isDarkMode, navigate, theme }) {
  const adminItems =
    active === 'cashier'
      ? cashierItems
      : active === 'cashierOrders'
        ? cashierItems
        : active === 'customer'
          ? customerItems
          : active === 'customerOrder'
            ? customerOrderItems
            : active === 'customerOrders'
              ? customerItems
              : active === 'customerMarketing'
                ? customerOrderItems
                : active === 'kitchenOrders'
                ? defaultItems
      : defaultItems;
  const items = currentRoleId === 'waiter'
    ? customerItems
    : currentRoleId === 'cashier'
      ? cashierItems
      : currentRoleId === 'kitchen'
        ? defaultItems
        : adminItems;

  return (
    <BlurView
      experimentalBlurMethod="dimezisBlurView"
      intensity={isDarkMode ? 42 : 58}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[
        styles.bottomNav,
        {
          backgroundColor: isDarkMode ? 'rgba(48, 36, 28, 0.68)' : 'rgba(255, 255, 255, 0.66)',
          borderColor: isDarkMode ? 'rgba(255, 244, 220, 0.16)' : 'rgba(255, 255, 255, 0.82)',
          boxShadow: isDarkMode ? '0 10px 28px rgba(0, 0, 0, 0.35)' : '0 10px 28px rgba(0, 0, 0, 0.12)',
        },
      ]}
    >
      <View pointerEvents="none" style={[styles.glassBubble, styles.glassBubbleLeft, { backgroundColor: isDarkMode ? 'rgba(217, 119, 6, 0.14)' : 'rgba(255, 255, 255, 0.5)' }]} />
      <View pointerEvents="none" style={[styles.glassBubble, styles.glassBubbleRight, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(248, 231, 181, 0.48)' }]} />
      {items.map((item) => {
        const isActive = item.target === active;

        return (
          <Pressable
            key={item.label}
            accessibilityLabel={item.label}
            onPress={() => {
              if (
                item.target === 'dashboard' ||
                item.target === 'cashier' ||
                item.target === 'cashierOrders' ||
                item.target === 'customer' ||
                item.target === 'customerMarketing' ||
                item.target === 'customerOrder' ||
                item.target === 'customerOrders' ||
                item.target === 'kitchen' ||
                item.target === 'kitchenInventory'
                || item.target === 'kitchenOrders' ||
                item.target === 'profile' ||
                item.target === 'notifications' ||
                item.target === 'activity'
              ) {
                navigate(item.target);
              }
            }}
            style={styles.navItem}
          >
            <Ionicons
              color={isActive ? theme.amber : theme.navInactive}
              name={isActive ? item.activeIcon : item.icon}
              size={20}
            />
            <Text selectable style={[styles.navLabel, { color: isActive ? theme.amber : theme.navInactive }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    bottom: 18,
    flexDirection: 'row',
    height: 62,
    justifyContent: 'space-around',
    left: 31,
    position: 'absolute',
    right: 31,
    overflow: 'hidden',
    zIndex: 3,
  },
  glassBubble: {
    borderRadius: 999,
    position: 'absolute',
  },
  glassBubbleLeft: {
    height: 72,
    left: -18,
    top: -38,
    width: 112,
  },
  glassBubbleRight: {
    bottom: -42,
    height: 78,
    right: 18,
    width: 126,
  },
  navItem: {
    alignItems: 'center',
    minWidth: 42,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    paddingTop: 2,
  },
});
