import { StyleSheet, Text, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import CashierTabs from '../components/CashierTabs';
import MockStatusBar from '../components/MockStatusBar';
import ModuleCard from '../components/ModuleCard';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';
import { cashierModules } from '../data/appData';

const hourlyBuckets = [
  { label: '8-10', start: 8, end: 10 },
  { label: '10-12', start: 10, end: 12 },
  { label: '12-14', start: 12, end: 14 },
  { label: '14-16', start: 14, end: 16 },
  { label: '16-18', start: 16, end: 18 },
  { label: '18-22', start: 18, end: 22 },
];

function isToday(value) {
  const date = new Date(value || 0);
  const today = new Date();
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

export default function CashierScreen({
  cashierExpenses = [],
  cashierPurchases = [],
  customerOrders = [],
  goBack,
  isDarkMode,
  setIsDarkMode,
  theme,
  navigate,
}) {
  const paidOrders = customerOrders.filter((order) =>
    (order.cashierStatus === 'paid' || order.statusType === 'paid') && isToday(order.paidAt || order.createdAt),
  );
  const pendingOrders = customerOrders.filter((order) => order.statusType === 'ready');
  const cancelledOrders = customerOrders.filter((order) =>
    order.statusType === 'cancelled' && isToday(order.createdAt),
  );
  const salesTotal = paidOrders.reduce((total, order) => total + getNumericTotal(order), 0);
  const todayExpenses = cashierExpenses.filter((expense) => isToday(expense.createdAt));
  const todayPurchases = cashierPurchases.filter((purchase) =>
    purchase.type === 'paid' && isToday(purchase.createdAt),
  );
  const financialExpenses = [
    ...todayExpenses,
    ...todayPurchases.map((purchase) => ({ ...purchase, category: 'Suministros' })),
  ];
  const expenseTotal = financialExpenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
  const profitTotal = salesTotal - expenseTotal;
  const paidCount = paidOrders.length;
  const pendingCount = pendingOrders.length;
  const cancelledCount = cancelledOrders.length;
  const paymentMethodsData = getPaymentMethods(paidOrders, salesTotal);
  const financeFlowData = getFinanceFlow(salesTotal, expenseTotal, profitTotal);
  const hourlySalesData = hourlyBuckets.map((bucket) => ({
    label: bucket.label,
    value: paidOrders.reduce((total, order) => {
      const paidAt = new Date(order.paidAt || order.createdAt || 0);
      return !Number.isNaN(paidAt.getTime()) && paidAt.getHours() >= bucket.start && paidAt.getHours() < bucket.end
        ? total + getNumericTotal(order)
        : total;
    }, 0),
  }));
  const paymentStatusData = [
    { icon: '✅', value: String(paidCount), label: 'Pagados' },
    { icon: '⏳', value: String(pendingCount), label: 'Pendientes' },
    { icon: '❌', value: String(cancelledCount), label: 'Cancelado' },
  ];
  const cashierStatsData = [
    { icon: '🧾', value: String(paidCount), label: 'Pedidos' },
    { icon: '💰', value: formatCompactCurrency(profitTotal), label: 'Ganancia' },
    { icon: '🛒', value: formatCompactCurrency(expenseTotal), label: 'Gastos' },
  ];
  const cashCutData = [
    { label: 'Efectivo esperado', value: formatCompactCurrency(paymentMethodsData[0].value) },
    { label: 'Tarjeta registrada', value: formatCompactCurrency(paymentMethodsData[1].value) },
    { label: 'Transferencias', value: formatCompactCurrency(paymentMethodsData[2].value) },
    { label: 'Total corte', value: formatCompactCurrency(salesTotal), strong: true },
  ];
  const expenseCategoriesData = getExpenseCategories(financialExpenses);
  const recentPaymentsData = getRecentPayments(paidOrders);
  const topProductsData = getTopProducts(paidOrders);
  const latestPayment = paidOrders[0];
  const cashierAlertsData = [
    { icon: '⏳', text: `${pendingCount} pedidos pendientes de pago.` },
    { icon: '💵', text: `Utilidad estimada: ${formatCompactCurrency(profitTotal)}.` },
    { icon: '📄', text: `${cashierExpenses.length} gastos y ${cashierPurchases.length} compras registradas.` },
  ];
  const cashierMovements = [
    ...paidOrders.slice(0, 2).map((order) => ({ icon: '✅', text: `${order.id} pagado con ${order.paymentMethod || 'método no indicado'}` })),
    ...cashierExpenses.slice(0, 2).map((expense) => ({ icon: '🧾', text: `Gasto registrado: ${expense.description || expense.category || 'Sin descripción'}` })),
    ...cashierPurchases.slice(0, 2).map((purchase) => ({ icon: '🛒', text: `Compra registrada: ${purchase.name || 'Insumo'}` })),
  ].slice(0, 4);

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <AppHeader
          eyebrow="Módulo"
          title="Caja"
          subtitle="Pagos, cuentas y ganancias"
          icon="💵"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <CashierTabs active="cashier" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Ventas del día"
          amount={formatCurrency(salesTotal)}
          subtitle={`Ganancia actual ${formatCompactCurrency(profitTotal)}`}
          icon="📊"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {cashierStatsData.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        <SectionTitle title="Accesos rápidos" subtitle="Gestiona las funciones principales de caja" compact theme={theme} />

        <View style={styles.modulesGrid}>
          {cashierModules.filter((module) => module.target).map((module) => (
            <ModuleCard
              key={module.title}
              item={module}
              isDarkMode={isDarkMode}
              theme={theme}
              onPress={() => {
                if (
                  module.target === 'cashierAccounts' ||
                  module.target === 'cashierOrders' ||
                  module.target === 'cashierPurchases'
                ) {
                  navigate(module.target);
                }
              }}
            />
          ))}
        </View>

        <View
          style={[
            styles.cashStatus,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(120, 53, 15, 0)',
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <Text selectable style={[styles.statusHeading, { color: theme.title }]}>
              Estado de caja
            </Text>
            <View
              style={[
                styles.openBadge,
                {
                  backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#ffffff',
                  borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : 'rgba(21, 128, 61, 0)',
                },
              ]}
            >
              <Text style={[styles.openBadgeText, { color: isDarkMode ? '#86efac' : '#15803d' }]}>Sincronizada</Text>
            </View>
          </View>

          <View style={styles.statusInfo}>
            <View style={styles.statusCopy}>
              <Text selectable style={[styles.statusTitle, { color: theme.title }]}>
                Último pago recibido
              </Text>
              <Text selectable style={[styles.statusDetail, { color: theme.muted }]}>
                {latestPayment ? `${latestPayment.id} · ${latestPayment.paymentMethod || 'Efectivo'}` : 'Sin pagos nuevos registrados'}
              </Text>
            </View>
            <Text selectable style={[styles.statusAmount, { color: isDarkMode ? theme.amber : theme.accent }]}>
              {latestPayment ? formatCurrency(getNumericTotal(latestPayment)) : '$0.00'}
            </Text>
          </View>
        </View>

        <SectionTitle title="Estadísticas de caja" subtitle="Lectura rápida para corte y operación" compact theme={theme} />

        <HourlySalesChart data={hourlySalesData} isDarkMode={isDarkMode} theme={theme} />

        <View style={styles.insightsGrid}>
          <PaymentMethodsCard data={paymentMethodsData} isDarkMode={isDarkMode} theme={theme} />
          <AverageTicketCard orderCount={paidCount} salesTotal={salesTotal} isDarkMode={isDarkMode} theme={theme} />
        </View>

        <FinanceFlowCard data={financeFlowData} isDarkMode={isDarkMode} theme={theme} />

        <View style={styles.paymentStatusRow}>
          {paymentStatusData.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        <CashCutCard data={cashCutData} isDarkMode={isDarkMode} theme={theme} />

        <View style={styles.insightsGrid}>
          <TopProductsCard data={topProductsData} isDarkMode={isDarkMode} theme={theme} />
          <ExpenseCategoriesCard data={expenseCategoriesData} isDarkMode={isDarkMode} theme={theme} />
        </View>

        <RecentPaymentsCard data={recentPaymentsData} isDarkMode={isDarkMode} theme={theme} />

        <AlertsCard alerts={cashierAlertsData} isDarkMode={isDarkMode} theme={theme} />

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

          {cashierMovements.map((movement) => (
            <View key={movement.text} style={styles.movementItem}>
              <AppIcon color={theme.amber} name={movement.icon} size={18} />
              <Text selectable style={[styles.movementCopy, { color: theme.muted }]}>
                {movement.text}
              </Text>
            </View>
          ))}
          {!cashierMovements.length ? (
            <Text selectable style={[styles.movementCopy, { color: theme.muted, marginTop: 10 }]}>
              Aún no hay movimientos sincronizados.
            </Text>
          ) : null}
        </View>
      </View>

    </ScreenBackground>
  );
}

function InsightCard({ children, isDarkMode, style, theme, title }) {
  return (
    <View
      style={[
        styles.insightCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
        style,
      ]}
    >
      <Text selectable style={[styles.insightTitle, { color: theme.title }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function HourlySalesChart({ data, isDarkMode, theme }) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  return (
    <InsightCard isDarkMode={isDarkMode} theme={theme} title="Ventas por hora">
      <View style={styles.hourBars}>
        {data.map((item) => (
          <View key={item.label} style={styles.hourItem}>
            <Text selectable style={[styles.hourValue, { color: theme.muted }]}>
              {item.value}
            </Text>
            <View
              style={[
                styles.hourBar,
                {
                  backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                  height: 30 + (item.value / maxValue) * 58,
                },
              ]}
            />
            <Text selectable style={[styles.hourLabel, { color: theme.muted }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </InsightCard>
  );
}

function PaymentMethodsCard({ data, isDarkMode, theme }) {
  return (
    <InsightCard isDarkMode={isDarkMode} style={styles.halfCard} theme={theme} title="Métodos de pago">
      {data.map((item) => (
        <MetricBar key={item.label} item={item} isDarkMode={isDarkMode} theme={theme} />
      ))}
    </InsightCard>
  );
}

function AverageTicketCard({ isDarkMode, orderCount, salesTotal, theme }) {
  const averageTicket = orderCount ? salesTotal / orderCount : 0;

  return (
    <InsightCard isDarkMode={isDarkMode} style={styles.halfCard} theme={theme} title="Ticket promedio">
      <Text selectable style={[styles.bigMetric, { color: theme.title }]}>
        {formatCurrency(averageTicket)}
      </Text>
      <Text selectable style={[styles.metricHint, { color: theme.muted }]}>
        {orderCount} pedidos pagados
      </Text>
      <View style={[styles.softPill, { backgroundColor: theme.actionSoft }]}>
        <Text selectable style={[styles.softPillText, { color: theme.amber }]}>
          Calculado con pagos sincronizados
        </Text>
      </View>
    </InsightCard>
  );
}

function FinanceFlowCard({ data, isDarkMode, theme }) {
  return (
    <InsightCard isDarkMode={isDarkMode} theme={theme} title="Ingresos vs gastos">
      {data.map((item) => (
        <MetricBar key={item.label} item={item} isDarkMode={isDarkMode} theme={theme} />
      ))}
    </InsightCard>
  );
}

function CashCutCard({ data, isDarkMode, theme }) {
  return (
    <InsightCard isDarkMode={isDarkMode} theme={theme} title="Corte estimado">
      {data.map((item) => (
        <View
          key={item.label}
          style={[
            styles.cutRow,
            item.strong && {
              backgroundColor: theme.actionSoft,
              borderRadius: 14,
              paddingHorizontal: 10,
              paddingVertical: 9,
            },
          ]}
        >
          <Text selectable style={[styles.cutLabel, { color: item.strong ? theme.title : theme.muted }]}>
            {item.label}
          </Text>
          <Text selectable style={[styles.cutValue, { color: item.strong ? theme.amber : theme.title }]}>
            {item.value}
          </Text>
        </View>
      ))}
    </InsightCard>
  );
}

function TopProductsCard({ data, isDarkMode, theme }) {
  return (
    <InsightCard isDarkMode={isDarkMode} style={styles.halfCard} theme={theme} title="Top productos">
      {data.map((item) => (
        <CompactMetric key={item.label} item={item} isDarkMode={isDarkMode} theme={theme} />
      ))}
      {!data.length ? <EmptyMetric theme={theme} /> : null}
    </InsightCard>
  );
}

function ExpenseCategoriesCard({ data, isDarkMode, theme }) {
  return (
    <InsightCard isDarkMode={isDarkMode} style={styles.halfCard} theme={theme} title="Gastos por categoría">
      {data.map((item) => (
        <CompactMetric key={item.label} item={item} isDarkMode={isDarkMode} theme={theme} />
      ))}
      {!data.length ? <EmptyMetric theme={theme} /> : null}
    </InsightCard>
  );
}

function RecentPaymentsCard({ data, isDarkMode, theme }) {
  return (
    <InsightCard isDarkMode={isDarkMode} theme={theme} title="Últimos pagos">
      {data.map((item) => (
        <View key={item.order} style={styles.paymentRow}>
          <View style={[styles.paymentIcon, { backgroundColor: theme.softIcon }]}>
            <AppIcon color={theme.amber} name="receipt" size={20} />
          </View>
          <View style={styles.paymentCopy}>
            <Text selectable style={[styles.paymentOrder, { color: theme.title }]}>
              Pedido {item.order}
            </Text>
            <Text selectable style={[styles.paymentDetail, { color: theme.muted }]}>
              {item.detail}
            </Text>
          </View>
          <Text selectable style={[styles.paymentValue, { color: theme.amber }]}>
            {item.value}
          </Text>
        </View>
      ))}
      {!data.length ? <EmptyMetric theme={theme} /> : null}
    </InsightCard>
  );
}

function EmptyMetric({ theme }) {
  return (
    <Text selectable style={[styles.metricHint, { color: theme.muted }]}>
      Aún no hay registros sincronizados.
    </Text>
  );
}

function AlertsCard({ alerts, isDarkMode, theme }) {
  return (
    <InsightCard
      isDarkMode={isDarkMode}
      style={{ backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.10)' : '#fef3c7' }}
      theme={theme}
      title="Alertas de caja"
    >
      {alerts.map((alert) => (
        <View key={alert.text} style={styles.alertRow}>
          <AppIcon color={theme.amber} name={alert.icon} size={18} />
          <Text selectable style={[styles.alertText, { color: theme.title }]}>
            {alert.text}
          </Text>
        </View>
      ))}
    </InsightCard>
  );
}

function MetricBar({ item, isDarkMode, theme }) {
  return (
    <View style={styles.metricBarItem}>
      <View style={styles.metricTop}>
        <Text selectable style={[styles.metricLabel, { color: theme.muted }]}>
          {item.label}
        </Text>
        <Text selectable style={[styles.metricValue, { color: theme.title }]}>
          ${item.value.toLocaleString('en-US')}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f3eee9' }]}>
        <View style={[styles.fill, { backgroundColor: item.color, width: `${item.percent}%` }]} />
      </View>
    </View>
  );
}

function CompactMetric({ item, isDarkMode, theme }) {
  return (
    <View style={styles.compactMetric}>
      <View style={styles.metricTop}>
        <Text selectable style={[styles.compactLabel, { color: theme.title }]}>
          {item.label}
        </Text>
        <Text selectable style={[styles.compactValue, { color: theme.amber }]}>
          {item.value}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f3eee9' }]}>
        <View style={[styles.fill, { backgroundColor: theme.amber, width: `${item.percent}%` }]} />
      </View>
    </View>
  );
}

function getNumericTotal(order) {
  if (typeof order.total === 'number') {
    return order.total;
  }

  return Number(String(order.amount || '0').replace(/[^0-9.]/g, '')) || 0;
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatCompactCurrency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString('en-US')}`;
}

function getPaymentMethods(paidOrders, salesTotal) {
  const live = paidOrders.reduce((totals, order) => {
    const method = order.paymentMethod || 'Efectivo';

    return {
      ...totals,
      [method]: (totals[method] || 0) + getNumericTotal(order),
    };
  }, {});
  const values = [
    { label: 'Efectivo', value: live.Efectivo || 0, color: '#22c55e' },
    { label: 'Tarjeta', value: live.Tarjeta || 0, color: '#f59e0b' },
    {
      label: 'Transferencia',
      value: live.Transferencia || 0,
      color: '#38bdf8',
    },
  ];

  return values.map((item) => ({
    ...item,
    percent: salesTotal && item.value ? Math.max(4, Math.round((item.value / salesTotal) * 100)) : 0,
  }));
}

function getFinanceFlow(salesTotal, expenseTotal, profitTotal) {
  return [
    { label: 'Ingresos', value: salesTotal, percent: 100, color: '#22c55e' },
    {
      label: 'Gastos',
      value: expenseTotal,
      percent: salesTotal && expenseTotal ? Math.min(100, Math.max(4, Math.round((expenseTotal / salesTotal) * 100))) : 0,
      color: '#ef4444',
    },
    {
      label: 'Utilidad',
      value: profitTotal,
      percent: salesTotal && profitTotal ? Math.min(100, Math.max(4, Math.round((Math.abs(profitTotal) / salesTotal) * 100))) : 0,
      color: '#f59e0b',
    },
  ];
}

function getExpenseCategories(expenses) {
  const totals = expenses.reduce((result, expense) => {
    const category = expense.category || 'Otros';

    return {
      ...result,
      [category]: (result[category] || 0) + Number(expense.amount || 0),
    };
  }, {});
  const entries = Object.entries(totals);
  const maxValue = Math.max(...entries.map(([, value]) => value), 1);

  if (!entries.length) {
    return [];
  }

  return entries.map(([label, value]) => ({
    label,
    value: formatCompactCurrency(value),
    percent: Math.max(8, Math.round((value / maxValue) * 100)),
  }));
}

function getRecentPayments(paidOrders) {
  const livePayments = paidOrders.slice(0, 3).map((order) => ({
    detail: `${order.table || order.detail?.split(' · ')[0] || 'Mesa'} · ${order.paymentMethod || 'Efectivo'}`,
    order: order.id.replace('Pedido ', '#'),
    value: formatCompactCurrency(getNumericTotal(order)),
  }));

  return livePayments;
}

function getTopProducts(paidOrders) {
  const counts = paidOrders.reduce((result, order) => {
    const items = order.productItems?.length
      ? order.productItems
      : String(order.products || '')
          .split(',')
          .map((name) => ({ name: name.trim(), quantity: 1 }))
          .filter((item) => item.name);

    return items.reduce(
      (nextResult, item) => ({
        ...nextResult,
        [item.name]: (nextResult[item.name] || 0) + Number(item.quantity || 1),
      }),
      result,
    );
  }, {});
  const liveItems = Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
  const maxValue = Math.max(...liveItems.map((item) => item.value), 1);

  if (!liveItems.length) {
    return [];
  }

  return liveItems.map((item) => ({
    ...item,
    percent: Math.max(12, Math.round((item.value / maxValue) * 100)),
  }));
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 1760,
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
  cashStatus: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  insightCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  halfCard: {
    flex: 1,
    marginTop: 0,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 12,
  },
  hourBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'space-between',
    minHeight: 126,
  },
  hourItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  hourValue: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
  },
  hourBar: {
    borderRadius: 10,
    width: 18,
  },
  hourLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
  },
  metricBarItem: {
    marginTop: 9,
  },
  metricTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  track: {
    borderRadius: 20,
    height: 8,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 20,
    height: '100%',
  },
  bigMetric: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricHint: {
    fontSize: 11,
    marginTop: 4,
  },
  softPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    marginTop: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  softPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  cutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cutLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  cutValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  compactMetric: {
    marginTop: 9,
  },
  compactLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '900',
    paddingRight: 6,
  },
  compactValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  paymentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
  },
  paymentIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  paymentIconText: {
    fontSize: 16,
  },
  paymentCopy: {
    flex: 1,
  },
  paymentOrder: {
    fontSize: 12,
    fontWeight: '900',
  },
  paymentDetail: {
    fontSize: 10,
    paddingTop: 2,
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  alertRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 9,
  },
  alertIcon: {
    fontSize: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  statusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusHeading: {
    fontSize: 14,
    fontWeight: '900',
  },
  openBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  statusCopy: {
    flex: 1,
    paddingRight: 10,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  statusDetail: {
    fontSize: 11,
    paddingTop: 3,
  },
  statusAmount: {
    fontSize: 14,
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
