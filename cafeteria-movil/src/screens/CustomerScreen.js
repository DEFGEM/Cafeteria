import { StyleSheet, Text, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import CustomerTabs from '../components/CustomerTabs';
import MockStatusBar from '../components/MockStatusBar';
import ModuleCard from '../components/ModuleCard';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';
import { customerModules } from '../data/appData';

const hourBuckets = [
  { label: '8-10', start: 8, end: 10 },
  { label: '10-12', start: 10, end: 12 },
  { label: '12-14', start: 12, end: 14 },
  { label: '14-16', start: 14, end: 16 },
  { label: '16-18', start: 16, end: 18 },
];

function isToday(value) {
  const date = new Date(value || 0);
  const today = new Date();
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function orderTotal(order) {
  return Number(order.total || String(order.amount || '').replace(/[^0-9.]/g, '')) || 0;
}

export default function CustomerScreen({
  availableTables = [],
  customerOrders = [],
  goBack,
  isDarkMode,
  navigate,
  promotions = [],
  setIsDarkMode,
  theme,
}) {
  const todayOrders = customerOrders.filter((order) => !order.createdAt || isToday(order.createdAt));
  const activeOrders = customerOrders.filter((order) => ['pending', 'kitchen', 'ready'].includes(order.statusType));
  const paidOrders = customerOrders.filter((order) => order.statusType === 'paid');
  const activeTableIds = new Set(activeOrders.map((order) => order.tableId || order.table).filter(Boolean));
  const orderStates = [
    { label: 'Pendientes', value: customerOrders.filter((order) => order.statusType === 'pending').length, color: '#f59e0b' },
    { label: 'En cocina', value: customerOrders.filter((order) => order.statusType === 'kitchen').length, color: '#d97706' },
    { label: 'Listos', value: customerOrders.filter((order) => order.statusType === 'ready').length, color: '#16a34a' },
    { label: 'Pagados', value: paidOrders.length, color: '#2563eb' },
  ];
  const tableStates = [
    { label: 'Ocupadas', value: activeTableIds.size, detail: 'Mesas con consumo' },
    { label: 'Libres', value: availableTables.length, detail: 'Disponibles ahora' },
    { label: 'Por pagar', value: customerOrders.filter((order) => order.statusType === 'ready').length, detail: 'Esperando caja' },
  ];
  const hourlyOrders = hourBuckets.map((bucket) => ({
    label: bucket.label,
    value: todayOrders.filter((order) => {
      const date = new Date(order.createdAt || 0);
      return !Number.isNaN(date.getTime()) && date.getHours() >= bucket.start && date.getHours() < bucket.end;
    }).length,
  }));
  const favoriteProducts = Object.values(customerOrders.flatMap((order) => order.productItems || []).reduce((result, item) => {
    const label = item.name || 'Producto';
    result[label] = result[label] || { icon: '☕', label, value: 0 };
    result[label].value += Number(item.quantity || 0);
    return result;
  }, {})).sort((left, right) => right.value - left.value).slice(0, 4);
  const promoStats = [
    { label: 'Activas', value: promotions.length },
    { label: 'Con producto', value: promotions.filter((promotion) => promotion.orderItem).length },
    { label: 'Pedidos hoy', value: todayOrders.length },
  ];
  const averageTicket = paidOrders.length
    ? paidOrders.reduce((total, order) => total + orderTotal(order), 0) / paidOrders.length
    : 0;
  const productCount = customerOrders.reduce(
    (total, order) => total + (order.productItems || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    0,
  );
  const averageProducts = customerOrders.length ? productCount / customerOrders.length : 0;
  const serviceDurations = paidOrders.map((order) => {
    const start = new Date(order.createdAt || 0);
    const end = new Date(order.paidAt || 0);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
      ? Math.max(0, (end.getTime() - start.getTime()) / 60000)
      : null;
  }).filter((value) => value !== null);
  const averageService = serviceDurations.length
    ? Math.round(serviceDurations.reduce((sum, value) => sum + value, 0) / serviceDurations.length)
    : 0;
  const recentOrder = customerOrders[0];
  const featuredPromotion = promotions[0];
  const movements = customerOrders.slice(0, 3).map((order) => ({
    icon: order.statusType === 'paid' ? '✅' : order.statusType === 'cancelled' ? '❌' : '🧾',
    text: `${order.id} · ${order.status || 'Sin estado'}`,
  }));
  const customerStats = [
    { icon: '🍽️', value: String(availableTables.length), label: 'Libres' },
    { icon: '⏳', value: String(activeOrders.length), label: 'En proceso' },
    { icon: '✅', value: String(paidOrders.length), label: 'Pagados' },
  ];
  const maxOrderState = Math.max(1, ...orderStates.map((state) => state.value));
  const maxHourlyOrders = Math.max(1, ...hourlyOrders.map((hour) => hour.value));
  const maxFavoriteProduct = Math.max(1, ...favoriteProducts.map((product) => product.value));
  const maxPromoStat = Math.max(1, ...promoStats.map((promo) => promo.value));

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <AppHeader
          eyebrow="Módulo"
          title="Cliente / Mesero"
          subtitle="Pedidos, mesas y promociones"
          icon="🧍"
          isDarkMode={isDarkMode}
          theme={theme}
          titleSize={24}
        />

        <CustomerTabs active="customer" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Pedidos levantados"
          amount={`${todayOrders.length} pedidos`}
          subtitle="Pedidos registrados durante el día"
          icon="🧾"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {customerStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        <SectionTitle title="Accesos rápidos" subtitle="Gestiona pedidos y atención al cliente" compact theme={theme} />

        <View style={styles.modulesGrid}>
          {customerModules.map((module) => (
            <ModuleCard
              key={module.title}
              item={module}
              isDarkMode={isDarkMode}
              onPress={() => {
                if (module.target) {
                  navigate(module.target);
                }
              }}
              theme={theme}
            />
          ))}
        </View>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Pedidos por estado">
          <View style={styles.metricList}>
            {orderStates.map((state) => (
              <HorizontalMetric
                key={state.label}
                color={state.color}
                label={state.label}
                max={maxOrderState}
                theme={theme}
                value={state.value}
              />
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Mesas activas">
          <View style={styles.tableGrid}>
            {tableStates.map((table) => (
              <View
                key={table.label}
                style={[
                  styles.tableCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.72)',
                  },
                ]}
              >
                <Text selectable style={[styles.tableValue, { color: theme.title }]}>
                  {table.value}
                </Text>
                <Text selectable style={[styles.tableLabel, { color: theme.title }]}>
                  {table.label}
                </Text>
                <Text selectable style={[styles.tableDetail, { color: theme.muted }]}>
                  {table.detail}
                </Text>
              </View>
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Pedidos por hora">
          <View style={styles.hourGrid}>
            {hourlyOrders.map((hour) => (
              <View key={hour.label} style={styles.hourItem}>
                <View
                  style={[
                    styles.hourBarTrack,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(120, 53, 15, 0.08)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.hourBarFill,
                      {
                        height: `${Math.max(22, (hour.value / maxHourlyOrders) * 100)}%`,
                        backgroundColor: isDarkMode ? '#d97706' : theme.accentAlt,
                      },
                    ]}
                  />
                </View>
                <Text selectable style={[styles.hourValue, { color: theme.title }]}>
                  {hour.value}
                </Text>
                <Text selectable style={[styles.hourLabel, { color: theme.muted }]}>
                  {hour.label}
                </Text>
              </View>
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Productos más pedidos">
          <View style={styles.metricList}>
            {favoriteProducts.map((product) => (
              <HorizontalMetric
                key={product.label}
                color={isDarkMode ? '#d97706' : theme.accentAlt}
                icon={product.icon}
                label={product.label}
                max={maxFavoriteProduct}
                theme={theme}
                value={product.value}
                valueSuffix="u"
              />
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Promociones disponibles">
          <View style={styles.metricList}>
            {promoStats.map((promo) => (
              <HorizontalMetric
                key={promo.label}
                color={promo.label === 'Activas' ? '#16a34a' : theme.accentAlt}
                label={promo.label}
                max={maxPromoStat}
                theme={theme}
                value={promo.value}
              />
            ))}
          </View>
          <Text selectable style={[styles.acceptanceText, { color: theme.muted }]}>
            Datos sincronizados con las promociones vigentes de la API
          </Text>
        </AnalyticsCard>

        <View
          style={[
            styles.ticketCard,
            {
              backgroundColor: isDarkMode ? 'rgba(217, 119, 6, 0.16)' : 'rgba(120, 53, 15, 0.10)',
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(120, 53, 15, 0.08)',
            },
          ]}
        >
          <View>
            <Text selectable style={[styles.ticketLabel, { color: theme.muted }]}>
              Ticket promedio por mesa
            </Text>
            <Text selectable style={[styles.ticketValue, { color: theme.title }]}>
              ${averageTicket.toFixed(2)}
            </Text>
            <Text selectable style={[styles.ticketDetail, { color: theme.muted }]}>
              {averageProducts.toFixed(1)} productos por pedido
            </Text>
          </View>
          <View style={[styles.ticketIconWrap, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.14)' : '#ffffff' }]}>
            <AppIcon color={theme.amber} name="receipt" size={20} />
          </View>
        </View>

        <View
          style={[
            styles.timeCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              boxShadow: theme.cardShadow,
            },
          ]}
        >
          <View>
            <Text selectable style={[styles.timeTitle, { color: theme.title }]}>
              Tiempo promedio de atención
            </Text>
            <Text selectable style={[styles.timeSubtitle, { color: theme.muted }]}>
              Pedido a entrega
            </Text>
          </View>
          <Text selectable style={[styles.timeValue, { color: theme.amber }]}>
            {averageService ? `${averageService} min` : 'Sin datos'}
          </Text>
        </View>

        <InfoCard
          badge={featuredPromotion?.badge || 'Sin promociones'}
          icon="⭐"
          isDarkMode={isDarkMode}
          subtitle={featuredPromotion?.detail || 'Las promociones vigentes aparecerán aquí'}
          theme={theme}
          title="Promoción del día"
          value={featuredPromotion?.title || 'No hay una promoción activa'}
          variant="marketing"
        />

        <InfoCard
          badge={recentOrder?.status || 'Sin actividad'}
          isDarkMode={isDarkMode}
          subtitle={recentOrder?.detail || 'Los pedidos sincronizados aparecerán aquí'}
          theme={theme}
          title="Pedido reciente"
          value={recentOrder?.id || 'Sin pedidos registrados'}
          amount={recentOrder?.amount || '$0.00'}
        />

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
            <View style={[styles.todayBadge, { backgroundColor: theme.actionSoft }]}>
              <Text style={[styles.todayText, { color: theme.amber }]}>Hoy</Text>
            </View>
          </View>

          {movements.map((movement) => (
            <View key={movement.text} style={styles.movementItem}>
              <AppIcon color={theme.amber} name={movement.icon} size={18} />
              <Text selectable style={[styles.movementCopy, { color: theme.muted }]}>
                {movement.text}
              </Text>
            </View>
          ))}
          {!movements.length ? (
            <Text selectable style={[styles.movementCopy, { color: theme.muted, marginTop: 10 }]}>
              Aún no hay movimientos sincronizados.
            </Text>
          ) : null}
        </View>
      </View>

    </ScreenBackground>
  );
}

function InfoCard({ amount, badge, icon, isDarkMode, subtitle, theme, title, value, variant }) {
  const isMarketing = variant === 'marketing';

  return (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: isMarketing
            ? isDarkMode
              ? theme.surfaceAlt
              : '#fef3c7'
            : isDarkMode
              ? theme.surface
              : theme.surfaceAlt,
          borderColor: isDarkMode ? theme.surfaceBorder : 'transparent',
          boxShadow: !isMarketing && !isDarkMode ? 'none' : theme.cardShadow,
        },
      ]}
    >
      <View style={styles.infoHeader}>
        <Text selectable style={[styles.infoTitle, { color: theme.title }]}>
          {title}
        </Text>
        <View
          style={[
            styles.infoBadge,
            {
              backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#ffffff',
            },
          ]}
        >
          <Text style={[styles.infoBadgeText, { color: theme.amber }]}>{badge}</Text>
        </View>
      </View>

      <View style={styles.infoBody}>
        <View style={styles.infoCopy}>
          <Text selectable style={[styles.infoValue, { color: theme.title }]}>
            {value}
          </Text>
          <Text selectable style={[styles.infoSubtitle, { color: theme.muted }]}>
            {subtitle}
          </Text>
        </View>
        {icon ? (
          <AppIcon color={theme.amber} name={icon} size={25} />
        ) : (
          <Text selectable style={[styles.infoStrong, { color: theme.amber }]}>{amount}</Text>
        )}
      </View>
    </View>
  );
}

function AnalyticsCard({ children, isDarkMode, theme, title }) {
  return (
    <View
      style={[
        styles.analyticsCard,
        {
          backgroundColor: isDarkMode ? 'rgba(87, 53, 34, 0.50)' : 'rgba(120, 53, 15, 0.08)',
          borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(120, 53, 15, 0.06)',
        },
      ]}
    >
      <Text selectable style={[styles.analyticsTitle, { color: theme.title }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function HorizontalMetric({ color, icon, label, max, theme, value, valueSuffix = '' }) {
  return (
    <View style={styles.horizontalMetric}>
      <View style={styles.metricHeader}>
        <View style={styles.metricLabelRow}>
          {icon ? <AppIcon color={theme.amber} name={icon} size={15} /> : null}
          <Text selectable style={[styles.metricLabel, { color: theme.title }]}>{label}</Text>
        </View>
        <Text selectable style={[styles.metricValue, { color: theme.amber }]}>
          {value}
          {valueSuffix}
        </Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { backgroundColor: color, width: `${Math.max(8, (value / max) * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  screen: {
    minHeight: 1720,
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
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
  },
  analyticsCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 15,
  },
  analyticsTitle: {
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
    gap: 10,
    justifyContent: 'space-between',
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
  tableGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
  },
  tableCard: {
    borderCurve: 'continuous',
    borderRadius: 16,
    flex: 1,
    padding: 11,
  },
  tableValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  tableLabel: {
    fontSize: 11,
    fontWeight: '900',
    paddingTop: 5,
  },
  tableDetail: {
    fontSize: 9,
    lineHeight: 12,
    paddingTop: 4,
  },
  hourGrid: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 128,
    paddingTop: 14,
  },
  hourItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  hourBarTrack: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 72,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 24,
  },
  hourBarFill: {
    borderCurve: 'continuous',
    borderRadius: 14,
    width: '100%',
  },
  hourValue: {
    fontSize: 11,
    fontWeight: '900',
    paddingTop: 7,
  },
  hourLabel: {
    fontSize: 10,
    paddingTop: 3,
  },
  acceptanceText: {
    fontSize: 11,
    paddingTop: 12,
  },
  ticketCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 16,
  },
  ticketLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  ticketValue: {
    fontSize: 25,
    fontWeight: '900',
    paddingTop: 4,
  },
  ticketDetail: {
    fontSize: 11,
    paddingTop: 4,
  },
  ticketIconWrap: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  ticketIcon: {
    fontSize: 25,
  },
  timeCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 15,
  },
  timeTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  timeSubtitle: {
    fontSize: 11,
    paddingTop: 4,
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  infoCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  infoHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  infoBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  infoBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  infoBody: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  infoCopy: {
    flex: 1,
    paddingRight: 10,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  infoSubtitle: {
    fontSize: 11,
    paddingTop: 3,
  },
  infoStrong: {
    fontSize: 20,
    fontWeight: '900',
  },
  movementCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
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
    marginTop: 9,
  },
  movementIcon: {
    fontSize: 14,
  },
  movementCopy: {
    flex: 1,
    fontSize: 11,
  },
});
