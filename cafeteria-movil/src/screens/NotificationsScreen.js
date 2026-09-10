import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';

import EmptyState from '../components/EmptyState';
import AppIcon from '../components/AppIcon';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import SummaryCard from '../components/SummaryCard';

const filters = ['Todas', 'Pedidos', 'Caja', 'Cocina', 'Inventario'];

export default function NotificationsScreen({
  customerOrders = [],
  goBack,
  isDarkMode,
  kitchenInventory = [],
  markNotificationRead,
  navigate,
  setIsDarkMode,
  systemEvents = [],
  theme,
}) {
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [query, setQuery] = useState('');
  const notifications = useMemo(
    () => buildNotifications(systemEvents, customerOrders, kitchenInventory),
    [customerOrders, kitchenInventory, systemEvents],
  );
  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter = activeFilter === 'Todas' || notification.module === activeFilter || notification.group === activeFilter;
    const searchText = `${notification.title} ${notification.detail} ${notification.module}`.toLowerCase();

    return matchesFilter && searchText.includes(query.trim().toLowerCase());
  });
  const urgentCount = notifications.filter((notification) => notification.severity === 'warning').length;

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <View style={styles.header}>
          <View>
            <Text selectable style={[styles.eyebrow, { color: theme.amber }]}>
              Centro
            </Text>
            <Text selectable style={[styles.title, { color: theme.title }]}>
              Notificaciones
            </Text>
            <Text selectable style={[styles.subtitle, { color: theme.muted }]}>
              Avisos de cocina, caja, pedidos e inventario
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? theme.accent : theme.accentAlt, boxShadow: theme.logoShadow }]}>
            <AppIcon color={theme.amber} name="notifications" size={24} />
          </View>
        </View>

        <SummaryCard
          title="Avisos pendientes"
          amount={`${notifications.length} avisos`}
          subtitle={`${urgentCount} requieren atencion`}
          icon="🔔"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, boxShadow: theme.cardShadow }]}>
          <AppIcon color={theme.muted} name="search" size={18} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Buscar aviso..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.title }]}
            value={query}
          />
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const active = filter === activeFilter;

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterChip, { backgroundColor: active ? theme.accent : theme.actionSoft }]}
              >
                <Text selectable style={[styles.filterText, { color: active ? '#ffffff' : theme.amber }]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Bandeja de avisos" subtitle="Toca el modulo relacionado para atender el aviso" compact theme={theme} />

        {filteredNotifications.length ? (
          <View style={styles.list}>
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                isDarkMode={isDarkMode}
                notification={notification}
                onOpen={async () => {
                  if (notification.apiId && !notification.read) await markNotificationRead?.(notification.apiId);
                  if (notification.target) navigate(notification.target);
                }}
                theme={theme}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            actionLabel="Ver actividad"
            icon="✅"
            onAction={() => navigate('activity')}
            subtitle="No hay avisos con ese filtro. La operacion esta limpia por ahora."
            theme={theme}
            title="Sin notificaciones"
          />
        )}
      </View>

    </ScreenBackground>
  );
}

function NotificationCard({ isDarkMode, notification, onOpen, theme }) {
  const colors = getSeverityColors(notification.severity, isDarkMode, theme);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.notificationCard,
        {
          backgroundColor: theme.surface,
          borderColor: colors.border,
          boxShadow: theme.cardShadow,
          opacity: notification.read ? 0.68 : pressed ? 0.86 : 1,
        },
      ]}
    >
      <View style={[styles.notificationIcon, { backgroundColor: colors.bg }]}>
        <AppIcon color={theme.amber} name={notification.icon} size={19} />
      </View>
      <View style={styles.notificationCopy}>
        <View style={styles.notificationTop}>
          <Text selectable style={[styles.notificationTitle, { color: theme.title }]}>
            {notification.title}
          </Text>
          <Text selectable style={[styles.notificationTime, { color: theme.muted }]}>
            {notification.createdAt}
          </Text>
        </View>
        <Text selectable style={[styles.notificationDetail, { color: theme.muted }]}>
          {notification.detail}
        </Text>
        <View style={[styles.modulePill, { backgroundColor: theme.actionSoft }]}>
          <Text selectable style={[styles.moduleText, { color: theme.amber }]}>
            {notification.module}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function buildNotifications(systemEvents, customerOrders, kitchenInventory) {
  const eventNotifications = systemEvents
    .filter((event) => event.type === 'notification' || event.severity === 'warning')
    .map((event) => ({
      ...event,
      group: getGroup(event.module),
      target: getTarget(event.module),
    }));
  const lowStock = kitchenInventory
    .filter((item) => Number(item.quantity || 0) <= Number(item.minimum || 0))
    .map((item) => ({
      createdAt: 'Ahora',
      detail: `${item.name}: ${item.quantity} ${item.unit} disponibles. Minimo ${item.minimum} ${item.unit}.`,
      group: 'Inventario',
      icon: '⚠️',
      id: `stock-${item.id}`,
      module: 'Inventario',
      severity: 'warning',
      target: 'kitchenInventory',
      title: 'Stock bajo',
    }));
  const readyOrders = customerOrders
    .filter((order) => order.statusType === 'ready')
    .map((order) => ({
      createdAt: order.readyAt || 'Ahora',
      detail: `${order.id} está listo para cobrar en caja.`,
      group: 'Pedidos',
      icon: '✅',
      id: `ready-${order.id}`,
      module: 'Cocina',
      severity: 'success',
      target: 'customerOrders',
      title: 'Pedido listo',
    }));
  const delayOrders = customerOrders
    .filter((order) => order.hasKitchenNotice)
    .map((order) => ({
      createdAt: order.waiterNotice?.createdAt || 'Ahora',
      detail: `${order.id}: ${order.kitchenNote || order.waiterNotice?.message}`,
      group: 'Pedidos',
      icon: '⏳',
      id: `delay-${order.id}`,
      module: 'Cocina',
      severity: 'warning',
      target: 'customerOrders',
      title: 'Demora reportada',
    }));

  return [...delayOrders, ...readyOrders, ...lowStock, ...eventNotifications];
}

function getGroup(module) {
  if (module === 'Caja') return 'Caja';
  if (module === 'Cocina') return 'Cocina';
  if (module === 'Inventario') return 'Inventario';
  return 'Pedidos';
}

function getTarget(module) {
  if (module === 'Caja') return 'cashier';
  if (module === 'Cocina') return 'kitchenOrders';
  if (module === 'Inventario') return 'kitchenInventory';
  return 'customerOrders';
}

function getSeverityColors(severity, isDarkMode, theme) {
  if (severity === 'warning') {
    return { bg: theme.warningBg, border: isDarkMode ? theme.warningText : 'rgba(245, 158, 11, 0.30)' };
  }

  if (severity === 'success') {
    return { bg: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7', border: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.20)' };
  }

  return { bg: theme.actionSoft, border: theme.surfaceBorder };
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 940,
    paddingBottom: 104,
  },
  content: {
    flex: 1,
    paddingBottom: 22,
    paddingHorizontal: 31,
    paddingTop: 31,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 28,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 35,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 13,
    paddingTop: 4,
  },
  headerIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  headerIconText: {
    fontSize: 27,
  },
  searchBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 46,
    marginTop: 14,
    paddingHorizontal: 15,
  },
  searchIcon: {
    fontSize: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    outlineStyle: 'none',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '900',
  },
  list: {
    gap: 10,
    paddingTop: 12,
  },
  notificationCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 13,
  },
  notificationIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  notificationIconText: {
    fontSize: 21,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  notificationTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  notificationTime: {
    fontSize: 9,
    fontWeight: '800',
  },
  notificationDetail: {
    fontSize: 11,
    lineHeight: 15,
    paddingTop: 4,
  },
  modulePill: {
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  moduleText: {
    fontSize: 9,
    fontWeight: '900',
  },
});
