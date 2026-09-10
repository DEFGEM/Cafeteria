import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useState } from 'react';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import CashierTabs from '../components/CashierTabs';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SummaryCard from '../components/SummaryCard';

const paymentOptions = ['Efectivo', 'Tarjeta', 'Transferencia'];

export default function CashierOrderDetailScreen({
  cancelOrder,
  canCancelOrders = false,
  chargeOrder,
  customerOrders,
  goBack,
  isDarkMode,
  selectedCashierOrderId,
  setIsDarkMode,
  theme,
  navigate,
}) {
  const selectedOrder =
    customerOrders.find((order) => order.id === selectedCashierOrderId) ||
    customerOrders.find((order) => order.statusType === 'ready') ||
    customerOrders[0];
  const [paymentMethod, setPaymentMethod] = useState(selectedOrder?.paymentMethod || 'Efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [decision, setDecision] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedOrder) {
    return (
      <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
        <View style={styles.content}>
          <MockStatusBar
            isDarkMode={isDarkMode}
            navigate={navigate}
            onBack={goBack}
            setIsDarkMode={setIsDarkMode}
            showBack
            theme={theme}
          />
          <AppHeader
            eyebrow="Caja"
            title="Detalle pedido"
            subtitle="No hay pedidos disponibles"
            icon="🧾"
            isDarkMode={isDarkMode}
            theme={theme}
          />
        </View>
      </ScreenBackground>
    );
  }

  const productItems = getProductItems(selectedOrder);
  const subtotal = selectedOrder.subtotal ?? getNumericTotal(selectedOrder) / 1.16;
  const tax = selectedOrder.tax ?? getNumericTotal(selectedOrder) - subtotal;
  const total = selectedOrder.total ?? getNumericTotal(selectedOrder);
  const isPending = selectedOrder.statusType === 'ready';
  const isCancelled = selectedOrder.statusType === 'cancelled';
  const receivedValue = Number(amountReceived || 0);
  const change = paymentMethod === 'Efectivo' && receivedValue >= total ? receivedValue - total : 0;

  const confirmDecision = async () => {
    if (decision === 'print') {
      setDecision(null);
      return;
    }

    if (decision === 'send' && paymentMethod === 'Efectivo' && receivedValue < total) {
      Alert.alert('Monto insuficiente', `Ingresa al menos ${formatCurrency(total)} para completar el cobro.`);
      return;
    }

    try {
      setIsSubmitting(true);

      if (decision === 'send') {
        await chargeOrder?.(selectedOrder.apiId ?? selectedOrder.id, {
          amountReceived: paymentMethod === 'Efectivo' ? receivedValue : total,
          paymentMethod,
          reference: paymentReference.trim() || undefined,
        });
      }

      if (decision === 'cancel') {
        await cancelOrder?.(selectedOrder.apiId ?? selectedOrder.id);
      }

      setDecision(null);
      navigate('cashierOrders');
    } catch (error) {
      Alert.alert(
        decision === 'send' ? 'No se pudo cobrar el pedido' : 'No se pudo cancelar el pedido',
        error?.userMessage || error?.message || 'Revisa la conexión con la API e inténtalo de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar
          isDarkMode={isDarkMode}
          navigate={navigate}
          onBack={goBack}
          setIsDarkMode={setIsDarkMode}
          showBack
          theme={theme}
        />

        <AppHeader
          eyebrow="Caja"
          title="Detalle pedido"
          subtitle="Ticket y cobro del pedido listo"
          icon="🧾"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <CashierTabs active="cashierOrders" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Proceso de pedido"
          amount={selectedOrder.id}
          subtitle={selectedOrder.detail}
          icon="💵"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View
          style={[
            styles.ticketCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              boxShadow: theme.cardShadow,
            },
          ]}
        >
          <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderCopy}>
              <Text selectable style={[styles.ticketTitle, { color: theme.title }]}>
                Información del pedido
              </Text>
              <Text selectable style={[styles.ticketSubtitle, { color: theme.muted }]}>
                Resumen completo antes de cobrar
              </Text>
            </View>
            <StatusBadge isDarkMode={isDarkMode} order={selectedOrder} theme={theme} />
          </View>

          <View style={[styles.customerBox, { backgroundColor: theme.actionSoft }]}>
            <InfoBlock label="Cliente / Mesa" value={selectedOrder.table || selectedOrder.detail.split(' · ')[0]} theme={theme} />
            <InfoBlock label="Atendió" value={selectedOrder.servedBy || 'Mesero'} theme={theme} />
          </View>

          <Text selectable style={[styles.productsTitle, { color: theme.title }]}>
            Productos
          </Text>

          {productItems.map((product, index) => (
            <View
              key={`${product.name}-${index}`}
              style={[styles.productItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#eeeeee' }]}
            >
              <View style={styles.productCopy}>
                <Text selectable style={[styles.productName, { color: theme.title }]}>
                  {product.quantity ? `${product.quantity}x ${product.name}` : product.name}
                </Text>
                <Text selectable style={[styles.productUnit, { color: theme.muted }]}>
                  {product.price ? `${formatCurrency(product.price)} c/u` : 'Detalle del pedido'}
                </Text>
              </View>
              <Text selectable style={[styles.productTotal, { color: theme.amber }]}>
                {product.total ? formatCurrency(product.total) : ''}
              </Text>
            </View>
          ))}

          <View style={[styles.observations, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.10)' : '#fff7ed' }]}>
            <Text selectable style={[styles.label, { color: theme.muted }]}>
              Observaciones
            </Text>
            <Text selectable style={[styles.observationText, { color: theme.title }]}>
              {selectedOrder.notes || 'Sin observaciones.'}
            </Text>
          </View>

          <View style={[styles.totalBox, { backgroundColor: theme.actionSoft }]}>
            <TotalRow label="Subtotal" value={formatCurrency(subtotal)} theme={theme} />
            <TotalRow label="IVA" value={formatCurrency(tax)} theme={theme} />
            <TotalRow final isDarkMode={isDarkMode} label="Total + IVA" value={formatCurrency(total)} theme={theme} />
          </View>

          <View style={styles.paymentSection}>
            <Text selectable style={[styles.label, { color: theme.muted }]}>
              Método de pago
            </Text>
            <View style={styles.paymentOptions}>
              {paymentOptions.map((option) => {
                const active = option === paymentMethod;

                return (
                  <Pressable
                    disabled={!isPending}
                    key={option}
                    onPress={() => setPaymentMethod(option)}
                    style={({ pressed }) => [
                      styles.paymentOption,
                      {
                        backgroundColor: active
                          ? isDarkMode
                            ? theme.accent
                            : theme.accentAlt
                          : isDarkMode
                            ? 'rgba(255, 255, 255, 0.10)'
                            : theme.actionSoft,
                        opacity: !isPending ? 0.68 : pressed ? 0.84 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.paymentText, { color: active ? '#ffffff' : theme.amber }]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            {isPending && paymentMethod === 'Efectivo' ? (
              <View style={styles.paymentInputGroup}>
                <Text selectable style={[styles.label, { color: theme.muted }]}>Monto recibido</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setAmountReceived}
                  placeholder={formatCurrency(total)}
                  placeholderTextColor={theme.muted}
                  style={[styles.paymentInput, { backgroundColor: theme.actionSoft, borderColor: theme.surfaceBorder, color: theme.title }]}
                  value={amountReceived}
                />
                <Text selectable style={[styles.changeText, { color: theme.amber }]}>Cambio: {formatCurrency(change)}</Text>
              </View>
            ) : null}
            {isPending && paymentMethod !== 'Efectivo' ? (
              <View style={styles.paymentInputGroup}>
                <Text selectable style={[styles.label, { color: theme.muted }]}>Referencia (opcional)</Text>
                <TextInput
                  onChangeText={setPaymentReference}
                  placeholder="Folio o referencia"
                  placeholderTextColor={theme.muted}
                  style={[styles.paymentInput, { backgroundColor: theme.actionSoft, borderColor: theme.surfaceBorder, color: theme.title }]}
                  value={paymentReference}
                />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable onPress={() => setDecision('print')} style={[styles.actionButton, styles.printButton]}>
            <Text style={styles.printText}>Ver ticket</Text>
          </Pressable>
          <Pressable
            disabled={!isPending}
            onPress={() => setDecision('send')}
            style={[
              styles.actionButton,
              styles.sendButton,
              !isPending && {
                opacity: 0.55,
              },
            ]}
          >
            <Text style={styles.sendText}>{isPending ? 'Confirmar cobro' : 'Ya procesado'}</Text>
          </Pressable>
        </View>

        {isPending && canCancelOrders && (
          <Pressable onPress={() => setDecision('cancel')} style={[styles.cancelFullButton, { backgroundColor: '#dc2626' }]}>
            <Text style={styles.cancelFullText}>Cancelar pedido</Text>
          </Pressable>
        )}

        <View
          style={[
            styles.invoiceAlert,
            {
              backgroundColor: isCancelled ? '#fee2e2' : theme.surfaceAlt,
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
            },
          ]}
        >
          <AppIcon color={isCancelled ? '#ef4444' : theme.amber} name={isCancelled ? 'close-circle' : 'warning'} size={20} />
          <Text selectable style={[styles.alertText, { color: isCancelled ? '#991b1b' : theme.title }]}>
            {isCancelled ? 'Este pedido fue cancelado' : isPending ? 'El pedido está listo para cobrar' : 'El pedido ya fue procesado'}
          </Text>
        </View>
      </View>

      <DecisionModal
        decision={decision}
        isDarkMode={isDarkMode}
        isSubmitting={isSubmitting}
        onCancel={() => setDecision(null)}
        onConfirm={confirmDecision}
        order={selectedOrder}
        paymentMethod={paymentMethod}
        theme={theme}
      />
    </ScreenBackground>
  );
}

function getNumericTotal(order) {
  if (typeof order.total === 'number') {
    return order.total;
  }

  return Number(String(order.amount || '0').replace(/[^0-9.]/g, '')) || 0;
}

function getProductItems(order) {
  if (order.productItems?.length) {
    return order.productItems;
  }

  return String(order.products || 'Pedido sin productos').split(', ').map((name) => ({ name }));
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function StatusBadge({ isDarkMode, order, theme }) {
  const colors = {
    cancelled: { backgroundColor: '#fee2e2', borderColor: 'transparent', color: '#b91c1c' },
    kitchen: { backgroundColor: isDarkMode ? 'rgba(251, 146, 60, 0.15)' : '#ffedd5', borderColor: 'transparent', color: isDarkMode ? '#fb923c' : '#c2410c' },
    pending: { backgroundColor: theme.warningBg, borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.25)' : 'transparent', color: theme.warningText },
    ready: { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7', borderColor: 'transparent', color: isDarkMode ? '#86efac' : '#166534' },
  };
  const badgeColors = colors[order.statusType] || colors.pending;

  return (
    <View
      style={[
        styles.activeBadge,
        {
          backgroundColor: badgeColors.backgroundColor,
          borderColor: badgeColors.borderColor,
        },
      ]}
    >
      <Text style={[styles.activeBadgeText, { color: badgeColors.color }]}>{order.status}</Text>
    </View>
  );
}

function InfoBlock({ label, value, theme }) {
  return (
    <View style={styles.infoBlock}>
      <Text selectable style={[styles.label, { color: theme.muted }]}>
        {label}
      </Text>
      <Text selectable style={[styles.infoValue, { color: theme.title }]}>
        {value}
      </Text>
    </View>
  );
}

function TotalRow({ final = false, isDarkMode, label, theme, value }) {
  return (
    <View
      style={[
        styles.totalRow,
        final && [
          styles.finalTotalRow,
          { borderTopColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(120, 53, 15, 0.18)' },
        ],
      ]}
    >
      <Text selectable style={[final ? styles.finalTotalText : styles.totalText, { color: final ? theme.title : theme.subtitle }]}>
        {label}
      </Text>
      <Text selectable style={[final ? styles.finalTotalValue : styles.totalValue, { color: final ? theme.amber : theme.subtitle }]}>
        {value}
      </Text>
    </View>
  );
}

function DecisionModal({ decision, isDarkMode, isSubmitting = false, onCancel, onConfirm, order, paymentMethod, theme }) {
  const isPrintDecision = decision === 'print';
  const copy = {
    cancel: `¿Seguro que deseas cancelar ${order?.id}? Este cambio se reflejará en Cliente/Mesero.`,
    print: `Vista previa del ticket de ${order?.id}.`,
    send: `¿Confirmar el cobro de ${order?.id} con ${paymentMethod}?`,
  };
  const title = {
    cancel: 'Cancelar pedido',
    print: 'Vista del ticket',
    send: 'Confirmar cobro',
  };

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(decision)}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            isPrintDecision && styles.printModalCard,
            {
              backgroundColor: isDarkMode ? '#231811' : '#ffffff',
              borderColor: theme.surfaceBorder,
              boxShadow: isDarkMode ? '0 18px 42px rgba(0,0,0,0.55)' : '0 18px 42px rgba(0,0,0,0.20)',
            },
          ]}
        >
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            {title[decision]}
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            {copy[decision]}
          </Text>
          {isPrintDecision && <TicketPreview isDarkMode={isDarkMode} order={order} paymentMethod={paymentMethod} theme={theme} />}
          <View style={styles.modalActions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.modalSecondary,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#efe7e1',
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={[styles.modalSecondaryText, { color: theme.title }]}>Volver</Text>
            </Pressable>
            <Pressable
              disabled={isSubmitting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalPrimary,
                {
                  backgroundColor: decision === 'cancel' ? '#dc2626' : decision === 'print' ? '#16a34a' : theme.accent,
                  opacity: isSubmitting ? 0.6 : pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.modalPrimaryText}>{isSubmitting ? 'Procesando…' : 'Confirmar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TicketPreview({ isDarkMode, order, paymentMethod, theme }) {
  const productItems = getProductItems(order);
  const subtotal = order?.subtotal ?? getNumericTotal(order) / 1.16;
  const tax = order?.tax ?? getNumericTotal(order) - subtotal;
  const total = order?.total ?? getNumericTotal(order);
  const table = order?.table || order?.detail?.split(' Â· ')[0] || 'Mesa';

  return (
    <View
      style={[
        styles.receiptPreview,
        {
          backgroundColor: isDarkMode ? '#fffaf0' : '#fffdf7',
          borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.28)' : 'rgba(120, 53, 15, 0.16)',
        },
      ]}
    >
      <View style={styles.receiptHeader}>
        <View>
          <Text selectable style={styles.receiptBrand}>
            CoffeeAdmin
          </Text>
          <Text selectable style={styles.receiptMuted}>
            Ticket de venta
          </Text>
        </View>
        <View style={styles.receiptBadge}>
          <AppIcon color={theme.amber} name="cafe" size={22} />
        </View>
      </View>

      <View style={styles.receiptMetaGrid}>
        <ReceiptMeta label="Folio" value={order?.id || 'Pedido'} />
        <ReceiptMeta label="Mesa" value={table} />
        <ReceiptMeta label="Atendió" value={order?.servedBy || 'Mesero'} />
        <ReceiptMeta label="Pago" value={paymentMethod} />
      </View>

      <View style={styles.receiptDivider} />

      {productItems.map((product, index) => (
        <View key={`${product.name}-${index}`} style={styles.receiptProductRow}>
          <View style={styles.receiptProductCopy}>
            <Text selectable style={styles.receiptProductName}>
              {product.quantity ? `${product.quantity}x ${product.name}` : product.name}
            </Text>
            <Text selectable style={styles.receiptMuted}>
              {product.price ? `${formatCurrency(product.price)} c/u` : 'Producto registrado'}
            </Text>
          </View>
          <Text selectable style={styles.receiptProductTotal}>
            {product.total ? formatCurrency(product.total) : ''}
          </Text>
        </View>
      ))}

      <View style={styles.receiptDivider} />

      <ReceiptTotalRow label="Subtotal" value={formatCurrency(subtotal)} />
      <ReceiptTotalRow label="IVA" value={formatCurrency(tax)} />
      <ReceiptTotalRow final label="Total" value={formatCurrency(total)} />

      <View style={styles.receiptFooter}>
        <Text selectable style={styles.receiptFooterText}>
          Gracias por tu compra
        </Text>
        <Text selectable style={styles.receiptMuted}>
          Comprobante generado por Cafetería
        </Text>
      </View>
    </View>
  );
}

function ReceiptMeta({ label, value }) {
  return (
    <View style={styles.receiptMetaItem}>
      <Text selectable style={styles.receiptMuted}>
        {label}
      </Text>
      <Text selectable style={styles.receiptMetaValue}>
        {value}
      </Text>
    </View>
  );
}

function ReceiptTotalRow({ final = false, label, value }) {
  return (
    <View style={[styles.receiptTotalRow, final && styles.receiptFinalRow]}>
      <Text selectable style={[styles.receiptTotalLabel, final && styles.receiptFinalText]}>
        {label}
      </Text>
      <Text selectable style={[styles.receiptTotalValue, final && styles.receiptFinalText]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 1080,
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
  ticketCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 15,
  },
  ticketHeader: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  ticketHeaderCopy: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  ticketSubtitle: {
    fontSize: 10,
    paddingTop: 3,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  customerBox: {
    borderCurve: 'continuous',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 11,
  },
  infoBlock: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '900',
    paddingTop: 4,
  },
  productsTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 13,
  },
  productItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingBottom: 8,
  },
  productCopy: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '900',
  },
  productUnit: {
    fontSize: 10,
    paddingTop: 3,
  },
  productTotal: {
    fontSize: 12,
    fontWeight: '900',
  },
  observations: {
    borderCurve: 'continuous',
    borderRadius: 15,
    marginTop: 11,
    padding: 10,
  },
  observationText: {
    fontSize: 12,
    fontWeight: '900',
    paddingTop: 4,
  },
  totalBox: {
    borderCurve: 'continuous',
    borderRadius: 16,
    marginTop: 12,
    padding: 11,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  finalTotalRow: {
    borderTopWidth: 1,
    marginBottom: 0,
    paddingTop: 8,
  },
  totalText: {
    fontSize: 11,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  finalTotalText: {
    fontSize: 14,
    fontWeight: '900',
  },
  finalTotalValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  paymentSection: {
    marginTop: 12,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  paymentOption: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  paymentText: {
    fontSize: 9,
    fontWeight: '800',
  },
  paymentInputGroup: {
    gap: 6,
    marginTop: 10,
  },
  paymentInput: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
  },
  printButton: {
    backgroundColor: '#16a34a',
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#eab308',
    flex: 1.4,
  },
  printText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  sendText: {
    color: '#451a03',
    fontSize: 12,
    fontWeight: '900',
  },
  cancelFullButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelFullText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  invoiceAlert: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 11,
  },
  alertIcon: {
    fontSize: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 360,
    padding: 20,
    width: '100%',
  },
  printModalCard: {
    maxWidth: 430,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  modalCopy: {
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalSecondary: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  modalPrimary: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  modalSecondaryText: {
    fontSize: 12,
    fontWeight: '900',
  },
  modalPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  receiptPreview: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  receiptHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptBrand: {
    color: '#451a03',
    fontSize: 18,
    fontWeight: '900',
  },
  receiptMuted: {
    color: '#78716c',
    fontSize: 10,
    paddingTop: 2,
  },
  receiptBadge: {
    alignItems: 'center',
    backgroundColor: '#78350f',
    borderRadius: 16,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  receiptBadgeText: {
    fontSize: 19,
  },
  receiptMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
  },
  receiptMetaItem: {
    backgroundColor: '#f3e8dc',
    borderCurve: 'continuous',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '48%',
  },
  receiptMetaValue: {
    color: '#451a03',
    fontSize: 11,
    fontWeight: '900',
    paddingTop: 3,
  },
  receiptDivider: {
    backgroundColor: '#eadfd5',
    height: 1,
    marginVertical: 12,
  },
  receiptProductRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  receiptProductCopy: {
    flex: 1,
    paddingRight: 10,
  },
  receiptProductName: {
    color: '#451a03',
    fontSize: 12,
    fontWeight: '900',
  },
  receiptProductTotal: {
    color: '#78350f',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  receiptFinalRow: {
    backgroundColor: '#f3e8dc',
    borderCurve: 'continuous',
    borderRadius: 12,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  receiptTotalLabel: {
    color: '#78716c',
    fontSize: 11,
  },
  receiptTotalValue: {
    color: '#451a03',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  receiptFinalText: {
    color: '#451a03',
    fontSize: 15,
    fontWeight: '900',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingTop: 12,
  },
  receiptFooterText: {
    color: '#451a03',
    fontSize: 12,
    fontWeight: '900',
  },
});
