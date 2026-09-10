import { StyleSheet, Text, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import MockStatusBar from '../components/MockStatusBar';
import ModuleCard from '../components/ModuleCard';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';
import { dashboardModules } from '../data/appData';

const hourlySales = [
  { label: '7-10', value: 0 },
  { label: '10-13', value: 0 },
  { label: '13-16', value: 0 },
  { label: '16-19', value: 0 },
  { label: '19-22', value: 0 },
];

function isToday(value) {
  const date = new Date(value || 0);
  const today = new Date();
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

export default function DashboardScreen({
  cashierExpenses = [],
  cashierPurchases = [],
  currentRole,
  customerOrders = [],
  isDarkMode,
  kitchenInventory = [],
  navigate,
  setIsDarkMode,
  theme,
  userProfile,
}) {
  const paidOrders = customerOrders.filter((order) => order.statusType === 'paid');
  const todayPaidOrders = paidOrders.filter((order) => isToday(order.paidAt || order.createdAt));
  const todayExpenses = cashierExpenses.filter((expense) => isToday(expense.createdAt));
  const todayPurchases = cashierPurchases.filter((purchase) =>
    purchase.type === 'paid' && isToday(purchase.createdAt),
  );
  const salesTotal = todayPaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const expensesTotal = [...todayExpenses, ...todayPurchases]
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const activeOrders = customerOrders.filter((order) => ['pending', 'kitchen', 'ready'].includes(order.statusType));
  const lowStockItems = kitchenInventory.filter((item) => Number(item.quantity || 0) <= Number(item.minimum || 0));
  const lastOrder = customerOrders[0];
  const liveStats = [
    { icon: '🧾', value: String(activeOrders.length), label: 'Activos' },
    { icon: '✅', value: String(todayPaidOrders.length), label: 'Pagados hoy' },
    { icon: '📦', value: String(lowStockItems.length), label: 'Stock bajo' },
  ];
  const liveOrderStates = [
    { label: 'Pendientes', value: customerOrders.filter((order) => order.statusType === 'pending').length, color: '#f59e0b' },
    { label: 'En cocina', value: customerOrders.filter((order) => order.statusType === 'kitchen').length, color: '#d97706' },
    { label: 'Listos', value: customerOrders.filter((order) => order.statusType === 'ready').length, color: '#16a34a' },
    { label: 'Cancelados', value: customerOrders.filter((order) => order.statusType === 'cancelled').length, color: '#dc2626' },
  ];
  const liveBestSellers = Object.values(todayPaidOrders.flatMap((order) => order.productItems || []).reduce((accumulator, item) => {
    const key = item.name || 'Producto';
    accumulator[key] = accumulator[key] || { icon: '☕', label: key, value: 0 };
    accumulator[key].value += Number(item.quantity || 0);
    return accumulator;
  }, {})).sort((left, right) => right.value - left.value).slice(0, 5);
  const liveFinanceStats = [
    { label: 'Ventas', value: salesTotal },
    { label: 'Gastos', value: expensesTotal },
    { label: 'Ganancia', value: salesTotal - expensesTotal },
  ];
  const paymentCounts = todayPaidOrders.reduce((counts, order) => {
    const method = order.paymentMethod || 'Sin método';
    counts[method] = (counts[method] || 0) + 1;
    return counts;
  }, {});
  const livePaymentMethods = Object.entries(paymentCounts).map(([label, count]) => ({
    label,
    value: todayPaidOrders.length ? Math.round((count / todayPaidOrders.length) * 100) : 0,
  }));
  const liveWeeklySales = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - offset));
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const value = paidOrders.reduce((total, order) => {
      const paidAt = new Date(order.paidAt || order.createdAt || 0);
      return paidAt >= date && paidAt < nextDate ? total + Number(order.total || 0) : total;
    }, 0);
    return { day: date.toLocaleDateString('es-MX', { weekday: 'short' }), value };
  });
  const liveHourlySales = hourlySales.map((bucket) => ({ ...bucket, value: 0 }));
  todayPaidOrders.forEach((order) => {
    const date = new Date(order.paidAt || order.createdAt || 0);
    if (Number.isNaN(date.getTime())) return;
    const hour = date.getHours();
    const index = hour < 10 ? 0 : hour < 13 ? 1 : hour < 16 ? 2 : hour < 19 ? 3 : 4;
    liveHourlySales[index].value += Number(order.total || 0);
  });
  const maxSales = Math.max(1, ...liveWeeklySales.map((sale) => sale.value));
  const maxHourlySales = Math.max(1, ...liveHourlySales.map((sale) => sale.value));
  const maxBestSeller = Math.max(1, ...liveBestSellers.map((product) => product.value));
  const maxOrderState = Math.max(1, ...liveOrderStates.map((state) => state.value));
  const maxFinance = Math.max(1, ...liveFinanceStats.map((stat) => Math.abs(stat.value)));
  const averageTicket = todayPaidOrders.length ? salesTotal / todayPaidOrders.length : 0;
  const liveModulePerformance = [
    { icon: '🧍', label: 'Mesero', value: `${customerOrders.length} pedidos`, detail: `${activeOrders.length} en proceso` },
    { icon: '💵', label: 'Caja', value: `${todayPaidOrders.length} pagos`, detail: `$${salesTotal.toFixed(2)} en ventas hoy` },
    { icon: '👨‍🍳', label: 'Cocina', value: `${customerOrders.filter((order) => order.statusType === 'ready').length} listos`, detail: `${customerOrders.filter((order) => order.statusType === 'kitchen').length} en preparación` },
    { icon: '📦', label: 'Inventario', value: `${kitchenInventory.length} insumos`, detail: `${lowStockItems.length} con stock bajo` },
  ];
  const visibleModules = currentRole?.moduleTargets
    ? dashboardModules.filter((module) => currentRole.moduleTargets.includes(module.target))
    : dashboardModules;

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} setIsDarkMode={setIsDarkMode} theme={theme} />

        <AppHeader
          eyebrow="Bienvenido"
          title={userProfile?.name || 'Usuario'}
          subtitle={`${userProfile?.role || currentRole?.label || 'Cuenta'} · Sistema de cafetería`}
          icon={currentRole?.icon || '☕'}
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <SummaryCard
          title="Resumen del día"
          amount={`$${salesTotal.toFixed(2)}`}
          subtitle="Ventas registradas hoy"
          icon="📊"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {liveStats.map((stat) => (
            <StatCard key={stat.label} {...stat} theme={theme} />
          ))}
        </View>

        <SectionTitle title="Módulos principales" subtitle="Selecciona el área que deseas usar" theme={theme} />

        <View style={styles.modulesGrid}>
          {visibleModules.map((module) => (
            <ModuleCard
              key={module.title}
              item={module}
              isDarkMode={isDarkMode}
              theme={theme}
              onPress={() => {
                navigate(module.target);
              }}
            />
          ))}
        </View>

        <View
          style={[
            styles.recentCard,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(120, 53, 15, 0)',
            },
          ]}
        >
          <View style={styles.recentHeader}>
            <Text selectable style={[styles.recentTitle, { color: theme.title }]}>
              Último pedido
            </Text>
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.10)' : '#ffffff',
                  borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(120, 53, 15, 0)',
                },
              ]}
            >
              <Text style={[styles.activeBadgeText, { color: theme.amber }]}>{lastOrder?.status || 'Sin actividad'}</Text>
            </View>
          </View>

          <View style={styles.orderInfo}>
            <View>
              <Text selectable style={[styles.orderTitle, { color: theme.title }]}>
                {lastOrder?.id || 'Sin pedidos registrados'}
              </Text>
              <Text selectable style={[styles.orderDetail, { color: theme.muted }]}>
                {lastOrder?.detail || 'Los pedidos sincronizados aparecerán aquí'}
              </Text>
            </View>
            <Text selectable style={[styles.orderAmount, { color: isDarkMode ? theme.amber : theme.title }]}>
              {lastOrder?.amount || '$0.00'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.weeklyCard,
            {
              backgroundColor: isDarkMode ? 'rgba(87, 53, 34, 0.50)' : 'rgba(120, 53, 15, 0.10)',
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(120, 53, 15, 0.08)',
            },
          ]}
        >
          <Text selectable style={[styles.weeklyTitle, { color: theme.title }]}>
            Ventas de la semana
          </Text>

          <View style={styles.chartRow}>
            {liveWeeklySales.map((sale) => {
              const barHeight = 36 + (sale.value / maxSales) * 66;

              return (
                <View key={sale.day} style={styles.chartItem}>
                  <Text selectable style={[styles.chartValue, { color: theme.muted }]}>
                    {sale.value}
                  </Text>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: barHeight,
                        backgroundColor: isDarkMode ? '#d97706' : theme.accentAlt,
                      },
                    ]}
                  />
                  <Text selectable style={[styles.chartLabel, { color: theme.muted }]}>
                    {sale.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Ventas por hora">
          <View style={styles.hourGrid}>
            {liveHourlySales.map((sale) => (
              <View key={sale.label} style={styles.hourItem}>
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
                        height: `${Math.max(22, (sale.value / maxHourlySales) * 100)}%`,
                        backgroundColor: isDarkMode ? '#d97706' : theme.accentAlt,
                      },
                    ]}
                  />
                </View>
                <Text selectable style={[styles.hourValue, { color: theme.title }]}>
                  {sale.value}
                </Text>
                <Text selectable style={[styles.hourLabel, { color: theme.muted }]}>
                  {sale.label}
                </Text>
              </View>
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Productos más vendidos">
          <View style={styles.metricList}>
            {liveBestSellers.map((product) => (
              <HorizontalMetric
                key={product.label}
                color={isDarkMode ? '#d97706' : theme.accentAlt}
                icon={product.icon}
                label={product.label}
                max={maxBestSeller}
                theme={theme}
                value={product.value}
                valueSuffix="u"
              />
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Pedidos por estado">
          <View style={styles.metricList}>
            {liveOrderStates.map((state) => (
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

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Stock crítico">
          <View style={styles.stockList}>
            {lowStockItems.map((item) => (
              <View
                key={item.id || item.name}
                style={[
                  styles.stockRow,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.70)',
                  },
                ]}
              >
                <AppIcon color={theme.amber} name={item.icon} size={20} />
                <View style={styles.stockCopy}>
                  <Text selectable style={[styles.stockTitle, { color: theme.title }]}>
                    {item.name}
                  </Text>
                  <Text selectable style={[styles.stockDetail, { color: theme.muted }]}>
                    {item.quantity} {item.unit} disponibles · mínimo {item.minimum}
                  </Text>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : '#ffedd5' }]}>
                  <Text selectable style={[styles.stockBadgeText, { color: isDarkMode ? '#fb923c' : '#c2410c' }]}>
                    Stock bajo
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Ganancia vs gastos">
          <View style={styles.metricList}>
            {liveFinanceStats.map((stat) => (
              <HorizontalMetric
                key={stat.label}
                color={stat.label === 'Gastos' ? '#dc2626' : stat.label === 'Ganancia' ? '#16a34a' : theme.accentAlt}
                label={stat.label}
                max={maxFinance}
                money
                theme={theme}
                value={stat.value}
              />
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Métodos de pago">
          <View style={styles.paymentRow}>
            {livePaymentMethods.map((method) => (
              <View
                key={method.label}
                style={[
                  styles.paymentItem,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.72)',
                  },
                ]}
              >
                <Text selectable style={[styles.paymentValue, { color: theme.title }]}>
                  {method.value}%
                </Text>
                <View style={[styles.paymentPill, { backgroundColor: isDarkMode ? '#d97706' : theme.accentAlt, width: `${method.value}%` }]} />
                <Text selectable style={[styles.paymentLabel, { color: theme.muted }]}>
                  {method.label}
                </Text>
              </View>
            ))}
          </View>
        </AnalyticsCard>

        <AnalyticsCard isDarkMode={isDarkMode} theme={theme} title="Rendimiento por módulo">
          <View style={styles.modulePerfGrid}>
            {liveModulePerformance.map((module) => (
              <View
                key={module.label}
                style={[
                  styles.modulePerfCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.72)',
                  },
                ]}
              >
                <AppIcon color={theme.amber} name={module.icon} size={20} />
                <Text selectable style={[styles.modulePerfTitle, { color: theme.title }]}>
                  {module.label}
                </Text>
                <Text selectable style={[styles.modulePerfValue, { color: theme.amber }]}>
                  {module.value}
                </Text>
                <Text selectable style={[styles.modulePerfDetail, { color: theme.muted }]}>
                  {module.detail}
                </Text>
              </View>
            ))}
          </View>
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
              Ticket promedio
            </Text>
            <Text selectable style={[styles.ticketValue, { color: theme.title }]}>
              ${averageTicket.toFixed(2)}
            </Text>
            <Text selectable style={[styles.ticketDetail, { color: theme.muted }]}>
              Calculado con {todayPaidOrders.length} pedidos pagados hoy
            </Text>
          </View>
          <View style={[styles.ticketIconWrap, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.14)' : '#ffffff' }]}>
            <AppIcon color={theme.amber} name="receipt" size={20} />
          </View>
        </View>
      </View>

    </ScreenBackground>
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

function HorizontalMetric({ color, icon, label, max, money = false, theme, value, valueSuffix = '' }) {
  const displayValue = money ? `$${value.toLocaleString('en-US')}` : `${value}${valueSuffix}`;
  const width = value === 0 ? 0 : Math.min(100, Math.max(8, (Math.abs(value) / Math.max(1, max)) * 100));

  return (
    <View style={styles.horizontalMetric}>
      <View style={styles.metricHeader}>
        <View style={styles.metricLabelRow}>
          {icon ? <AppIcon color={theme.amber} name={icon} size={15} /> : null}
          <Text selectable style={[styles.metricLabel, { color: theme.title }]}>{label}</Text>
        </View>
        <Text selectable style={[styles.metricValue, { color: theme.amber }]}>
          {displayValue}
        </Text>
      </View>
      <View style={[styles.metricTrack, { backgroundColor: 'rgba(120, 53, 15, 0.12)' }]}>
        <View style={[styles.metricFill, { backgroundColor: color, width: `${width}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  screen: {
    minHeight: 1820,
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
    marginTop: 18,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 14,
  },
  recentCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 15,
  },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  activeBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  orderDetail: {
    fontSize: 11,
    paddingTop: 3,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  weeklyCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 18,
  },
  weeklyTitle: {
    fontSize: 19,
    fontWeight: '900',
  },
  chartRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 145,
    paddingTop: 16,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  chartValue: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    paddingBottom: 6,
  },
  chartBar: {
    borderCurve: 'continuous',
    borderRadius: 10,
    width: 16,
  },
  chartLabel: {
    fontSize: 11,
    paddingTop: 7,
  },
  analyticsCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  hourGrid: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 136,
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
    height: 78,
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
  stockTitle: {
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
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
  },
  paymentItem: {
    borderCurve: 'continuous',
    borderRadius: 16,
    flex: 1,
    padding: 11,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  paymentPill: {
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 7,
    marginTop: 8,
    minWidth: 10,
  },
  paymentLabel: {
    fontSize: 10,
    paddingTop: 8,
  },
  modulePerfGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
  },
  modulePerfCard: {
    borderCurve: 'continuous',
    borderRadius: 16,
    flex: 1,
    padding: 11,
  },
  modulePerfIcon: {
    fontSize: 19,
  },
  modulePerfTitle: {
    fontSize: 11,
    fontWeight: '900',
    paddingTop: 8,
  },
  modulePerfValue: {
    fontSize: 11,
    fontWeight: '900',
    paddingTop: 5,
  },
  modulePerfDetail: {
    fontSize: 9,
    lineHeight: 12,
    paddingTop: 4,
  },
  ticketCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 17,
  },
  ticketLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  ticketValue: {
    fontSize: 27,
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
});
