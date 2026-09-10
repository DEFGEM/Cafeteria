import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useState } from 'react';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import CustomerTabs from '../components/CustomerTabs';
import EmptyState from '../components/EmptyState';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';

const steps = ['Pendiente', 'Cocina', 'Listo', 'Pagado'];

export default function CustomerOrdersScreen({
  cancelOrder,
  canCancelOrders = false,
  customerOrders = [],
  goBack,
  isDarkMode,
  setIsDarkMode,
  theme,
  navigate,
}) {
  const orders = customerOrders;
  const [comments, setComments] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const pendingCount = orders.filter((order) => order.statusType === 'pending').length;
  const kitchenCount = orders.filter((order) => order.statusType === 'kitchen').length;
  const readyCount = orders.filter((order) => order.statusType === 'ready').length;
  const activeCount = orders.filter((order) => !['cancelled', 'paid'].includes(order.statusType)).length;
  const kitchenAlerts = orders.filter((order) => order.kitchenNote || order.waiterNotice?.message);
  const orderStats = [
    { icon: '⏳', value: String(pendingCount), label: 'Pendientes' },
    { icon: '👨‍🍳', value: String(kitchenCount), label: 'En cocina' },
    { icon: '✅', value: String(readyCount), label: 'Listos' },
  ];

  const saveComment = () => {
    const cleanComment = commentDraft.trim();

    if (!cleanComment) {
      return;
    }

    setComments((currentComments) => [{ icon: '💬', text: cleanComment }, ...currentComments]);
    setCommentDraft('');
    setIsCommentOpen(false);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelOrder) return;
    setIsCancelling(true);
    setCancelError('');
    try {
      await cancelOrder(selectedOrder.apiId || selectedOrder.id);
      setSelectedOrder(null);
    } catch (error) {
      setCancelError(error?.userMessage || error?.message || 'No se pudo cancelar el pedido.');
    } finally {
      setIsCancelling(false);
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
          eyebrow="Cliente / Mesero"
          title="Mis pedidos"
          subtitle="Pedidos asignados al mesero"
          icon="🧾"
          isDarkMode={isDarkMode}
          theme={theme}
          titleSize={27}
        />

        <CustomerTabs active="customerOrders" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Estatus del pedido"
          amount={`${activeCount} activos`}
          subtitle="Pedidos asignados durante el día"
          icon="🍽️"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {orderStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        {kitchenAlerts.length ? (
          <KitchenAlertsCard alerts={kitchenAlerts} isDarkMode={isDarkMode} theme={theme} />
        ) : null}

        <SectionTitle
          title="Pedidos asignados"
          subtitle="Revisa el avance hasta el cobro"
          compact
          theme={theme}
        />

        <View style={styles.ordersList}>
          {orders.length ? (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                isDarkMode={isDarkMode}
                onAction={() => setSelectedOrder(order)}
                order={order}
                theme={theme}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Realizar pedido"
              icon="🧾"
              onAction={() => navigate('customerOrder')}
              subtitle="Cuando levantes un pedido, aparecerá aquí con su estado en caja y cocina."
              theme={theme}
              title="Sin pedidos asignados"
            />
          )}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => navigate('customerOrder')}
            style={({ pressed }) => [
              styles.actionButton,
              styles.addButton,
              {
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <Text style={styles.actionButtonText}>Agregar pedido</Text>
          </Pressable>
          <Pressable
            onPress={() => setIsCommentOpen(true)}
            style={({ pressed }) => [
              styles.actionButton,
              styles.commentButton,
              {
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <Text style={styles.actionButtonText}>Quejas o comentarios</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.commentsCard,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
            },
          ]}
        >
          <View style={styles.commentsHeader}>
            <Text selectable style={[styles.commentsTitle, { color: theme.title }]}>
              Comentarios recientes
            </Text>
            <View style={[styles.todayBadge, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.10)' : '#ffffff' }]}>
              <Text selectable style={[styles.todayText, { color: theme.amber }]}>
                Hoy
              </Text>
            </View>
          </View>

          {comments.map((comment, index) => (
            <View key={`${comment.text}-${index}`} style={styles.commentItem}>
              <AppIcon color={theme.amber} name={comment.icon} size={18} />
              <Text selectable style={[styles.commentText, { color: theme.muted }]}>
                {comment.text}
              </Text>
            </View>
          ))}
        </View>
      </View>


      <OrderDetailModal
        cancelError={cancelError}
        canCancel={canCancelOrders && ['pending', 'kitchen'].includes(selectedOrder?.statusType)}
        isDarkMode={isDarkMode}
        isCancelling={isCancelling}
        onCancelOrder={handleCancelOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        theme={theme}
      />
      <CommentModal
        commentDraft={commentDraft}
        isDarkMode={isDarkMode}
        isOpen={isCommentOpen}
        onCancel={() => setIsCommentOpen(false)}
        onChange={setCommentDraft}
        onSave={saveComment}
        theme={theme}
      />
    </ScreenBackground>
  );
}

function OrderCard({ isDarkMode, onAction, order, theme }) {
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
        <View style={styles.orderCopy}>
          <Text selectable style={[styles.orderTitle, { color: theme.title }]}>
            {order.id}
          </Text>
          <Text selectable style={[styles.orderDetail, { color: theme.muted }]}>
            {order.detail}
          </Text>
        </View>
        <StatusBadge isDarkMode={isDarkMode} status={order.status} type={order.statusType} />
      </View>

      <View style={styles.progressBox}>
        {steps.map((step, index) => {
          const isActive = index < order.stepsDone;

          return (
            <View
              key={step}
              style={[
                styles.progressStep,
                {
                  backgroundColor: isActive
                    ? isDarkMode
                      ? theme.accent
                      : theme.accentAlt
                    : isDarkMode
                      ? 'rgba(245, 158, 11, 0.10)'
                      : theme.actionSoft,
                },
              ]}
            >
              <Text selectable style={[styles.progressText, { color: isActive ? '#ffffff' : theme.amber }]}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      {order.kitchenNote || order.waiterNotice?.message ? (
        <View
          style={[
            styles.kitchenNotice,
            {
              backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#fff7ed',
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.22)' : '#fed7aa',
            },
          ]}
        >
          <AppIcon color={theme.amber} name="warning" size={19} />
          <View style={styles.kitchenNoticeCopy}>
            <Text selectable style={[styles.kitchenNoticeTitle, { color: theme.title }]}>
              Aviso de cocina
            </Text>
            <Text selectable style={[styles.kitchenNoticeText, { color: theme.muted }]}>
              {order.kitchenNote || order.waiterNotice?.message}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.orderBottom}>
        <Text selectable style={[styles.orderAmount, { color: isDarkMode ? theme.amber : theme.title }]}>
          {order.amount}
        </Text>
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.orderButton,
            {
              backgroundColor:
                order.actionType === 'deliver'
                  ? '#16a34a'
                  : isDarkMode
                    ? 'rgba(245, 158, 11, 0.12)'
                    : theme.actionSoft,
              opacity: pressed ? 0.86 : 1,
            },
          ]}
        >
          <Text
            selectable
            style={[
              styles.orderButtonText,
              {
                color: order.actionType === 'deliver' ? '#ffffff' : theme.amber,
              },
            ]}
          >
            {order.action}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function KitchenAlertsCard({ alerts, isDarkMode, theme }) {
  return (
    <View
      style={[
        styles.alertsCard,
        {
          backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.10)' : '#fff7ed',
          borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.22)' : '#fed7aa',
        },
      ]}
    >
      <View style={styles.alertsHeader}>
        <Text selectable style={[styles.alertsTitle, { color: theme.title }]}>
          Avisos de cocina
        </Text>
        <View style={[styles.alertCountBadge, { backgroundColor: isDarkMode ? theme.accent : theme.accentAlt }]}>
          <Text style={styles.alertCountText}>{alerts.length}</Text>
        </View>
      </View>

      {alerts.slice(0, 2).map((order) => (
        <View key={`alert-${order.id}`} style={styles.alertItem}>
          <Text style={styles.alertIcon}>⏱️</Text>
          <Text selectable style={[styles.alertText, { color: theme.muted }]}>
            {order.id}: {order.kitchenNote || order.waiterNotice?.message}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getCustomerNotes(order) {
  const notes = String(order?.notes || 'Sin observaciones.')
    .split('\n')
    .filter((line) => !line.trim().startsWith('Cocina:'))
    .join('\n')
    .trim();

  return notes || 'Sin observaciones.';
}

function StatusBadge({ isDarkMode, status, type }) {
  const colors = {
    kitchen: isDarkMode
      ? {
          backgroundColor: 'rgba(251, 146, 60, 0.15)',
          borderColor: 'rgba(251, 146, 60, 0.25)',
          color: '#fb923c',
        }
      : { backgroundColor: '#ffedd5', borderColor: 'transparent', color: '#c2410c' },
    ready: isDarkMode
      ? {
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          borderColor: 'rgba(34, 197, 94, 0.25)',
          color: '#86efac',
        }
      : { backgroundColor: '#dcfce7', borderColor: 'transparent', color: '#166534' },
    delivered: isDarkMode
      ? {
          backgroundColor: 'rgba(30, 58, 138, 0.40)',
          borderColor: 'rgba(147, 197, 253, 0.25)',
          color: '#93c5fd',
        }
      : { backgroundColor: '#dbeafe', borderColor: 'transparent', color: '#1e3a8a' },
    pending: isDarkMode
      ? {
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.25)',
          color: '#f59e0b',
        }
      : { backgroundColor: '#fef3c7', borderColor: 'transparent', color: '#78350f' },
    cancelled: isDarkMode
      ? {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.25)',
          color: '#fca5a5',
        }
      : { backgroundColor: '#fee2e2', borderColor: 'transparent', color: '#b91c1c' },
  };

  const badgeColors = colors[type] || colors.kitchen;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: badgeColors.backgroundColor,
          borderColor: badgeColors.borderColor,
        },
      ]}
    >
      <Text selectable style={[styles.statusText, { color: badgeColors.color }]}>
        {status}
      </Text>
    </View>
  );
}

function OrderDetailModal({ cancelError, canCancel, isCancelling, isDarkMode, onCancelOrder, onClose, order, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={Boolean(order)}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDarkMode ? '#231811' : '#ffffff',
              borderColor: theme.surfaceBorder,
              boxShadow: isDarkMode ? '0 18px 42px rgba(0,0,0,0.55)' : '0 18px 42px rgba(0,0,0,0.20)',
            },
          ]}
        >
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            {order?.id}
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            {order?.detail}
          </Text>
          <View style={[styles.detailBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f7eee5' }]}>
            <Text selectable style={[styles.detailLabel, { color: theme.muted }]}>
              Productos
            </Text>
            <Text selectable style={[styles.detailValue, { color: theme.title }]}>
              {order?.products}
            </Text>
            <Text selectable style={[styles.detailLabel, { color: theme.muted }]}>
              Observaciones
            </Text>
            <Text selectable style={[styles.detailValue, { color: theme.title }]}>
              {getCustomerNotes(order)}
            </Text>
            {order?.kitchenNote || order?.waiterNotice?.message ? (
              <>
                <Text selectable style={[styles.detailLabel, { color: theme.muted }]}>
                  Aviso de cocina
                </Text>
                <Text selectable style={[styles.detailValue, { color: theme.title }]}>
                  {order?.kitchenNote || order?.waiterNotice?.message}
                </Text>
              </>
            ) : null}
            <Text selectable style={[styles.detailLabel, { color: theme.muted }]}>
              Total
            </Text>
            <Text selectable style={[styles.detailAmount, { color: theme.amber }]}>
              {order?.amount}
            </Text>
          </View>
          {cancelError ? <Text selectable style={[styles.modalCopy, { color: '#dc2626' }]}>{cancelError}</Text> : null}
          <View style={styles.modalActions}>
            {canCancel ? (
              <Pressable
                disabled={isCancelling}
                onPress={onCancelOrder}
                style={({ pressed }) => [styles.modalSecondary, { backgroundColor: '#dc2626', opacity: pressed || isCancelling ? 0.7 : 1 }]}
              >
                <Text style={styles.modalPrimaryText}>{isCancelling ? 'Cancelando...' : 'Cancelar pedido'}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.modalPrimary,
                {
                  backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.modalPrimaryText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmDeliveryModal({ isDarkMode, onCancel, onConfirm, order, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(order)}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDarkMode ? '#231811' : '#ffffff',
              borderColor: theme.surfaceBorder,
              boxShadow: isDarkMode ? '0 18px 42px rgba(0,0,0,0.55)' : '0 18px 42px rgba(0,0,0,0.20)',
            },
          ]}
        >
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            Entregar pedido
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            ¿Seguro que deseas marcar {order?.id} como entregado?
          </Text>
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
              <Text style={[styles.modalSecondaryText, { color: theme.title }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalPrimary,
                {
                  backgroundColor: '#16a34a',
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.modalPrimaryText}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CommentModal({ commentDraft, isDarkMode, isOpen, onCancel, onChange, onSave, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={isOpen}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDarkMode ? '#231811' : '#ffffff',
              borderColor: theme.surfaceBorder,
              boxShadow: isDarkMode ? '0 18px 42px rgba(0,0,0,0.55)' : '0 18px 42px rgba(0,0,0,0.20)',
            },
          ]}
        >
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            Quejas o comentarios
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            Registra una nota para seguimiento del cliente.
          </Text>
          <View
            style={[
              styles.commentInputWrap,
              {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f7eee5',
                borderColor: theme.surfaceBorder,
              },
            ]}
          >
            <TextInput
              multiline
              onChangeText={onChange}
              placeholder="Escribe el comentario..."
              placeholderTextColor={theme.muted}
              style={[styles.commentInput, { color: theme.title }]}
              value={commentDraft}
            />
          </View>
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
              <Text style={[styles.modalSecondaryText, { color: theme.title }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              style={({ pressed }) => [
                styles.modalPrimary,
                {
                  backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.modalPrimaryText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 980,
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
  alertsCard: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    gap: 9,
    marginTop: 14,
    padding: 13,
  },
  alertsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertsTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  alertCountBadge: {
    alignItems: 'center',
    borderRadius: 18,
    height: 26,
    justifyContent: 'center',
    minWidth: 26,
    paddingHorizontal: 8,
  },
  alertCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  alertItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  alertIcon: {
    fontSize: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  ordersList: {
    gap: 10,
    paddingTop: 10,
  },
  orderCard: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
  },
  orderTop: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  orderCopy: {
    flex: 1,
    paddingRight: 4,
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  orderDetail: {
    fontSize: 10,
    lineHeight: 14,
    paddingTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
  },
  progressBox: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 11,
  },
  progressStep: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 26,
    paddingHorizontal: 2,
  },
  progressText: {
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
  },
  kitchenNotice: {
    alignItems: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
    padding: 10,
  },
  kitchenNoticeIcon: {
    fontSize: 14,
    paddingTop: 1,
  },
  kitchenNoticeCopy: {
    flex: 1,
    gap: 2,
  },
  kitchenNoticeTitle: {
    fontSize: 10,
    fontWeight: '900',
  },
  kitchenNoticeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  orderBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  orderAmount: {
    fontSize: 13,
    fontWeight: '900',
  },
  orderButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 88,
    paddingHorizontal: 12,
  },
  orderButtonText: {
    fontSize: 10,
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 39,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  addButton: {
    backgroundColor: '#16a34a',
    flex: 1,
  },
  commentButton: {
    backgroundColor: '#1e3a8a',
    flex: 1.3,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  commentsCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  commentsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentsTitle: {
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
    fontWeight: '900',
  },
  commentItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 9,
  },
  commentIcon: {
    fontSize: 14,
  },
  commentText: {
    flex: 1,
    fontSize: 11,
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
    maxWidth: 380,
    padding: 20,
    width: '100%',
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
  detailBox: {
    borderCurve: 'continuous',
    borderRadius: 16,
    marginTop: 14,
    padding: 14,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    paddingTop: 8,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    paddingTop: 3,
  },
  detailAmount: {
    fontSize: 18,
    fontWeight: '900',
    paddingTop: 3,
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
  modalPrimaryFull: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    marginTop: 16,
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
  commentInputWrap: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    minHeight: 92,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentInput: {
    fontSize: 13,
    fontWeight: '700',
    minHeight: 74,
    outlineStyle: 'none',
    textAlignVertical: 'top',
  },
});
