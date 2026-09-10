import { StyleSheet, Text, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import KitchenTabs from '../components/KitchenTabs';
import MockStatusBar from '../components/MockStatusBar';
import ModuleCard from '../components/ModuleCard';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';
import { quickKitchenActions } from '../data/appData';

const serviceBuckets = [
  { label: 'Mañana', start: 6, end: 12 },
  { label: 'Mediodía', start: 12, end: 15 },
  { label: 'Tarde', start: 15, end: 19 },
  { label: 'Noche', start: 19, end: 24 },
];

const kitchenModules = [
  {
    icon: '🧾',
    title: 'Pedidos',
    description: 'Ver pedidos pendientes y actualizar estado.',
    buttonLabel: 'Entrar',
    target: 'kitchenOrders',
  },
  ...quickKitchenActions.filter((item) => item.target !== 'kitchenOrders'),
  {
    icon: '🍽️',
    title: 'Gestión menú',
    description: 'Editar productos y disponibilidad.',
    buttonLabel: 'Gestionar',
    target: 'kitchenMenu',
  },
];

export default function KitchenScreen({ customerOrders = [], goBack, isDarkMode, kitchenInventory = [], setIsDarkMode, theme, navigate }) {
  const liveOrders = getKitchenOrders(customerOrders);
  const visibleOrders = liveOrders;
  const pendingCount = visibleOrders.filter((order) => order.statusType === 'pending').length;
  const progressCount = visibleOrders.filter((order) => ['kitchen', 'progress'].includes(order.statusType)).length;
  const readyCount = customerOrders.filter((order) => order.statusType === 'ready').length;
  const activeCount = pendingCount + progressCount;
  const stationLoad = [
    { label: 'Pendientes', value: pendingCount, color: '#f59e0b' },
    { label: 'En preparación', value: progressCount, color: '#d97706' },
    { label: 'Listos para caja', value: readyCount, color: '#22c55e' },
  ];
  const preparationSamples = customerOrders.filter((order) => order.preparationStartedAt && order.readyAt).map((order) => {
    const startedAt = new Date(order.preparationStartedAt);
    const readyAt = new Date(order.readyAt);
    return {
      label: String(order.productItems?.[0]?.name || order.id || 'Pedido').slice(0, 12),
      value: Math.max(0, Math.round((readyAt.getTime() - startedAt.getTime()) / 60000)),
    };
  }).filter((item) => Number.isFinite(item.value)).slice(0, 5);
  const prepTimes = preparationSamples;
  const serviceWindows = serviceBuckets.map((bucket) => ({
    label: bucket.label,
    value: customerOrders.filter((order) => {
      const date = new Date(order.createdAt || 0);
      return !Number.isNaN(date.getTime()) && date.getHours() >= bucket.start && date.getHours() < bucket.end;
    }).length,
  }));
  const maxPrepTime = Math.max(1, ...prepTimes.map((item) => item.value));
  const maxStationLoad = Math.max(1, ...stationLoad.map((item) => item.value));
  const maxServiceWindow = Math.max(1, ...serviceWindows.map((item) => item.value));
  const inventorySnapshot = kitchenInventory.map(normalizeInventoryItem);
  const lowStock = inventorySnapshot.filter((item) => item.statusType === 'low');
  const kitchenMovements = visibleOrders.slice(0, 3).map((order) => ({
    icon: order.statusType === 'ready' ? '✅' : order.statusType === 'kitchen' ? '🍳' : '🧾',
    text: `${order.id} · ${order.status || 'Sin estado'}`,
  }));
  const stats = [
    { icon: '⏳', value: String(pendingCount), label: 'Pendientes' },
    { icon: '🍳', value: String(progressCount), label: 'Preparación' },
    { icon: '✅', value: String(readyCount), label: 'Listos' },
  ];

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <AppHeader
          eyebrow="Módulo"
          title="Cocina"
          subtitle="Panel general de operación"
          icon="👨‍🍳"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <KitchenTabs active="kitchenDashboard" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Actividad de cocina"
          amount={`${activeCount} pedidos`}
          subtitle={`${pendingCount} pendientes · ${progressCount} en preparación`}
          icon="🔥"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        <SectionTitle title="Accesos rápidos" subtitle="Gestiona las áreas principales de cocina" compact theme={theme} />

        <View style={styles.quickGrid}>
          {kitchenModules.map((item) => (
            <ModuleCard
              key={item.title}
              item={item}
              isDarkMode={isDarkMode}
              onPress={() => {
                if (item.target) {
                  navigate(item.target);
                }
              }}
              theme={theme}
            />
          ))}
        </View>

        <InsightCard isDarkMode={isDarkMode} theme={theme} title="Carga por estado">
          <View style={styles.metricList}>
            {stationLoad.map((item) => (
              <HorizontalMetric key={item.label} item={item} max={maxStationLoad} theme={theme} />
            ))}
          </View>
        </InsightCard>

        <InsightCard isDarkMode={isDarkMode} theme={theme} title="Tiempo promedio de preparación">
          <View style={styles.prepChart}>
            {prepTimes.map((item) => (
              <View key={item.label} style={styles.prepItem}>
                <Text selectable style={[styles.prepValue, { color: theme.title }]}>
                  {item.value}m
                </Text>
                <View
                  style={[
                    styles.prepBar,
                    {
                      backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                      height: 34 + (item.value / maxPrepTime) * 60,
                    },
                  ]}
                />
                <Text selectable style={[styles.prepLabel, { color: theme.muted }]}>
                  {item.label}
                </Text>
              </View>
            ))}
            {!prepTimes.length ? (
              <Text selectable style={[styles.emptyText, { color: theme.muted }]}>
                Aún no hay pedidos con tiempos completos para calcular esta métrica.
              </Text>
            ) : null}
          </View>
        </InsightCard>

        <InsightCard isDarkMode={isDarkMode} theme={theme} title="Flujo por horario">
          <View style={styles.metricList}>
            {serviceWindows.map((item) => (
              <HorizontalMetric
                key={item.label}
                item={{ ...item, color: isDarkMode ? '#d97706' : theme.accentAlt }}
                max={maxServiceWindow}
                theme={theme}
                suffix=" pedidos"
              />
            ))}
          </View>
        </InsightCard>

        <InsightCard isDarkMode={isDarkMode} theme={theme} title="Insumos críticos">
          <View style={styles.stockList}>
            {lowStock.map((item) => (
              <View
                key={item.name}
                style={[
                  styles.stockRow,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
                  },
                ]}
              >
                <AppIcon color={theme.amber} name={item.icon} size={20} />
                <View style={styles.stockCopy}>
                  <Text selectable style={[styles.stockName, { color: theme.title }]}>
                    {item.name}
                  </Text>
                  <Text selectable style={[styles.stockDetail, { color: theme.muted }]}>
                    {item.quantityText || item.quantity}
                  </Text>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: theme.warningBg }]}>
                  <Text style={[styles.stockBadgeText, { color: theme.warningText }]}>Bajo</Text>
                </View>
              </View>
            ))}
            {!lowStock.length ? (
              <Text selectable style={[styles.emptyText, { color: theme.muted }]}>
                No hay insumos por debajo de su stock mínimo.
              </Text>
            ) : null}
          </View>
        </InsightCard>

        <SectionTitle title="Pedidos recientes" subtitle="Vista rápida del trabajo actual" compact theme={theme} />

        <View style={styles.ordersList}>
          {visibleOrders.slice(0, 3).map((order) => (
            <RecentOrderCard key={order.id} isDarkMode={isDarkMode} order={order} theme={theme} />
          ))}
          {!visibleOrders.length ? (
            <Text selectable style={[styles.emptyText, { color: theme.muted }]}>
              No hay pedidos pendientes, en preparación o listos.
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.movementCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              boxShadow: theme.cardShadow,
            },
          ]}
        >
          <View style={styles.movementHeader}>
            <Text selectable style={[styles.movementTitle, { color: theme.title }]}>
              Últimos movimientos
            </Text>
            <View
              style={[
                styles.todayBadge,
                {
                  backgroundColor: theme.actionSoft,
                  borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(120, 53, 15, 0)',
                },
              ]}
            >
              <Text style={[styles.todayText, { color: theme.amber }]}>Hoy</Text>
            </View>
          </View>

          {kitchenMovements.map((movement) => (
            <View key={movement.text} style={styles.movementItem}>
              <AppIcon color={theme.amber} name={movement.icon} size={18} />
              <Text selectable style={[styles.movementCopy, { color: theme.muted }]}>
                {movement.text}
              </Text>
            </View>
          ))}
          {!kitchenMovements.length ? (
            <Text selectable style={[styles.emptyText, { color: theme.muted, marginTop: 10 }]}>
              Aún no hay movimientos sincronizados.
            </Text>
          ) : null}
        </View>
      </View>

    </ScreenBackground>
  );
}

function getKitchenOrders(customerOrders) {
  return customerOrders
    .filter((order) => ['pending', 'kitchen', 'ready'].includes(order.statusType))
    .map((order) => ({
      id: order.id,
      detail: order.detail,
      status: order.status,
      statusType: order.statusType,
    }));
}

function normalizeInventoryItem(item) {
  const quantity = Number(item.quantity || 0);
  const minimum = Number(item.minimum || 0);

  return {
    ...item,
    quantityText: `${quantity} ${item.unit || ''} disponibles`.trim(),
    status: quantity <= minimum ? 'Bajo' : 'Normal',
    statusType: quantity <= minimum ? 'low' : 'normal',
  };
}

function InsightCard({ children, isDarkMode, theme, title }) {
  return (
    <View
      style={[
        styles.insightCard,
        {
          backgroundColor: isDarkMode ? 'rgba(87, 53, 34, 0.50)' : 'rgba(120, 53, 15, 0.08)',
          borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(120, 53, 15, 0.06)',
        },
      ]}
    >
      <Text selectable style={[styles.insightTitle, { color: theme.title }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function HorizontalMetric({ item, max, suffix = '', theme }) {
  return (
    <View style={styles.horizontalMetric}>
      <View style={styles.metricHeader}>
        <Text selectable style={[styles.metricLabel, { color: theme.title }]}>
          {item.label}
        </Text>
        <Text selectable style={[styles.metricValue, { color: theme.amber }]}>
          {item.value}
          {suffix}
        </Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { backgroundColor: item.color, width: `${Math.max(8, (item.value / max) * 100)}%` }]} />
      </View>
    </View>
  );
}

function RecentOrderCard({ isDarkMode, order, theme }) {
  const isPending = order.statusType === 'pending';
  const isReady = order.statusType === 'ready';
  const badgeColor = isReady ? '#16a34a' : isPending ? theme.warningText : theme.progressText;
  const badgeBg = isReady ? (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7') : isPending ? theme.warningBg : theme.progressBg;

  return (
    <View
      style={[
        styles.orderCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderTextBlock}>
          <Text selectable style={[styles.orderTitle, { color: theme.title }]}>
            {order.id}
          </Text>
          <Text selectable style={[styles.orderDetail, { color: theme.muted }]}>
            {order.detail}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: isDarkMode ? badgeColor : 'transparent' }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{order.status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 1320,
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
  },
  insightCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 15,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricList: {
    gap: 12,
    paddingTop: 14,
  },
  horizontalMetric: {
    gap: 7,
  },
  metricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  metricValue: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  metricTrack: {
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 9,
    overflow: 'hidden',
  },
  metricFill: {
    borderCurve: 'continuous',
    borderRadius: 999,
    height: '100%',
  },
  prepChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'space-between',
    minHeight: 140,
    paddingTop: 14,
  },
  prepItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  prepValue: {
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
  },
  prepBar: {
    borderCurve: 'continuous',
    borderRadius: 10,
    width: 18,
  },
  prepLabel: {
    fontSize: 9,
    paddingTop: 7,
    textAlign: 'center',
  },
  stockList: {
    gap: 10,
    paddingTop: 14,
  },
  stockRow: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 12,
  },
  stockIcon: {
    fontSize: 20,
  },
  stockCopy: {
    flex: 1,
  },
  stockName: {
    fontSize: 12,
    fontWeight: '900',
  },
  stockDetail: {
    fontSize: 10,
    paddingTop: 2,
  },
  stockBadge: {
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  ordersList: {
    gap: 10,
    paddingTop: 12,
  },
  orderCard: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
  },
  orderTop: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  orderTextBlock: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  orderDetail: {
    fontSize: 11,
    lineHeight: 14,
    paddingTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  movementCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  movementHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  movementTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  todayBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '800',
  },
  movementItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  movementIcon: {
    fontSize: 14,
  },
  movementCopy: {
    flex: 1,
    fontSize: 11,
  },
  emptyText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 12,
  },
});
