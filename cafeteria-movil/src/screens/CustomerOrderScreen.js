import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useState } from 'react';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import CustomerTabs from '../components/CustomerTabs';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import SummaryCard from '../components/SummaryCard';

export default function CustomerOrderScreen({
  addCustomerOrder,
  availableTables = [],
  customerDraft,
  goBack,
  isDarkMode,
  kitchenMenuItems = [],
  resetCustomerDraft,
  setIsDarkMode,
  theme,
  navigate,
  updateCustomerDraft,
}) {
  const tableOptions = availableTables.map((table) => ({
    id: table.id ?? table.id_mesa ?? table.number ?? table.numero,
    label: table.label || table.name || `Mesa ${table.number ?? table.numero ?? table.id ?? table.id_mesa}`,
  }));
  const selectedTableId = customerDraft?.selectedTableId ?? tableOptions[0]?.id ?? null;
  const selectedTableOption = tableOptions.find((table) => String(table.id) === String(selectedTableId)) || tableOptions[0];
  const selectedTable = selectedTableOption?.label || 'Sin mesa disponible';
  const draftProducts = customerDraft?.products || [];
  const menuProducts = kitchenMenuItems
    .filter((item) => item.available)
    .map((item) => {
      const draftProduct = draftProducts.find((product) => product.name === item.name || product.menuId === item.id);

      return {
        category: item.category,
        icon: item.icon,
        menuId: item.id,
        name: item.name,
        price: Number(draftProduct?.promotionId ? draftProduct.price : item.price || 0),
        promotionId: draftProduct?.promotionId || null,
        quantity: draftProduct?.quantity || 0,
      };
    });
  const orderProducts = menuProducts;
  const observations = customerDraft?.observations || '';
  const [decision, setDecision] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productCount = orderProducts.reduce((total, product) => total + product.quantity, 0);
  const orderTotal = orderProducts.reduce((total, product) => total + product.quantity * product.price, 0);
  const selectedProducts = orderProducts.filter((product) => product.quantity > 0);

  const updateQuantity = (name, delta) => {
    const selectedProduct = orderProducts.find((product) => product.name === name);

    updateCustomerDraft((currentDraft) => ({
      ...currentDraft,
      products: currentDraft.products.some((product) => product.name === name || product.menuId === selectedProduct?.menuId)
        ? currentDraft.products.map((product) =>
            product.name === name || product.menuId === selectedProduct?.menuId
              ? {
                  ...product,
                  icon: selectedProduct?.icon || product.icon,
                  menuId: selectedProduct?.menuId || product.menuId,
                  name: selectedProduct?.name || product.name,
                  price: selectedProduct?.price ?? product.price,
                  quantity: Math.max(0, product.quantity + delta),
                }
              : product,
          )
        : [
            ...currentDraft.products,
            {
              icon: selectedProduct?.icon || '📦',
              menuId: selectedProduct?.menuId,
              name,
              price: selectedProduct?.price || 0,
              quantity: Math.max(0, delta),
            },
          ],
    }));
  };

  const updateSelectedTable = (table) => {
    updateCustomerDraft((currentDraft) => ({
      ...currentDraft,
      selectedTable: table.label,
      selectedTableId: table.id,
    }));
  };

  const updateObservations = (text) => {
    updateCustomerDraft((currentDraft) => ({
      ...currentDraft,
      observations: text,
    }));
  };

  const handleDecisionConfirm = async () => {
    if (decision === 'confirm') {
      const orderedProducts = orderProducts.filter((product) => product.quantity > 0);

      if (!selectedTableOption) {
        Alert.alert('Mesa requerida', 'No hay una mesa disponible para registrar el pedido.');
        setDecision(null);
        return;
      }

      if (!orderedProducts.length || orderedProducts.some((product) => !product.menuId)) {
        Alert.alert('Pedido incompleto', 'Selecciona al menos un producto sincronizado con la API.');
        setDecision(null);
        return;
      }

      try {
        setIsSubmitting(true);
        await addCustomerOrder?.({
          items: orderedProducts.map((product) => ({
            productId: product.menuId,
            promotionId: product.promotionId || undefined,
            quantity: product.quantity,
          })),
          observations: observations.trim() || null,
          tableId: selectedTableOption.id,
        });
        resetCustomerDraft();
        setDecision(null);
        navigate('customerOrders');
      } catch (error) {
        Alert.alert(
          'No se pudo crear el pedido',
          error?.userMessage || error?.message || 'Revisa la conexión y vuelve a intentarlo.',
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    resetCustomerDraft();
    setDecision(null);
    navigate('customer');
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
          title="Realizar pedido"
          subtitle="Selecciona mesa, productos y confirma"
          icon="📝"
          isDarkMode={isDarkMode}
          theme={theme}
          titleSize={25}
        />

        <CustomerTabs active="customerOrder" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Nuevo pedido"
          amount={selectedTable}
          subtitle={productCount > 0 ? 'Pedido listo para confirmar' : 'Selecciona productos para continuar'}
          icon="🍽️"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <SectionTitle title="Selecciona una mesa" subtitle="Elige dónde se levantará el pedido" compact theme={theme} />

        <View style={styles.tablesGrid}>
          {tableOptions.map((table) => {
            const isActive = String(table.id) === String(selectedTableOption?.id);

            return (
              <Pressable
                key={String(table.id)}
                accessibilityLabel={table.label}
                onPress={() => updateSelectedTable(table)}
                style={({ pressed }) => [
                  styles.tableBox,
                  {
                    backgroundColor: isActive ? (isDarkMode ? theme.accent : theme.accentAlt) : theme.surface,
                    borderColor: isActive ? 'transparent' : theme.surfaceBorder,
                    boxShadow: isActive ? '0 8px 16px rgba(120, 53, 15, 0.22)' : theme.cardShadow,
                    opacity: pressed ? 0.84 : 1,
                  },
                ]}
              >
                <Text selectable style={[styles.tableText, { color: isActive ? '#ffffff' : theme.title }]}>
                  {table.label}
                </Text>
              </Pressable>
            );
          })}
          {!tableOptions.length ? (
            <Text selectable style={[styles.emptyText, { color: theme.muted }]}>No hay mesas libres en este momento.</Text>
          ) : null}
        </View>

        <SectionTitle title="Agregar productos" subtitle="Selecciona productos del menú" compact theme={theme} />

        <View style={styles.productList}>
          {orderProducts.map((product) => (
            <View
              key={product.name}
              style={[
                styles.productCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  boxShadow: theme.cardShadow,
                },
              ]}
            >
              <View style={styles.productLeft}>
                <View style={[styles.itemIcon, { backgroundColor: theme.softIcon }]}>
                  <AppIcon color={theme.amber} name={product.icon} size={22} />
                </View>
                <View style={styles.productCopy}>
                  <Text selectable style={[styles.productName, { color: theme.title }]}>
                    {product.name}
                  </Text>
                  <Text selectable style={[styles.productPrice, { color: theme.muted }]}>
                    ${product.price.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.quantityBox}>
                <QuantityButton
                  disabled={product.quantity === 0}
                  isDarkMode={isDarkMode}
                  label="-"
                  onPress={() => updateQuantity(product.name, -1)}
                  theme={theme}
                />
                <Text selectable style={[styles.quantityText, { color: theme.title }]}>
                  {product.quantity}
                </Text>
                <QuantityButton
                  isDarkMode={isDarkMode}
                  label="+"
                  onPress={() => updateQuantity(product.name, 1)}
                  theme={theme}
                />
              </View>
            </View>
          ))}
          {!orderProducts.length ? (
            <Text selectable style={[styles.emptyText, { color: theme.muted }]}>No hay productos disponibles en el menú.</Text>
          ) : null}
        </View>

        <View
          style={[
            styles.observationsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              boxShadow: theme.cardShadow,
            },
          ]}
        >
          <Text selectable style={[styles.cardLabel, { color: theme.title }]}>
            Observaciones
          </Text>
          <View
            style={[
              styles.observationInput,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(120, 53, 15, 0.08)',
                borderColor: theme.surfaceBorder,
              },
            ]}
          >
            <TextInput
              multiline
              onChangeText={updateObservations}
              placeholder="Escribe observaciones del pedido..."
              placeholderTextColor={theme.muted}
              style={[styles.observationText, { color: theme.title }]}
              value={observations}
            />
          </View>
        </View>

        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.surfaceBorder,
            },
          ]}
        >
          <View>
            <Text selectable style={[styles.totalLabel, { color: theme.muted }]}>
              Total del pedido
            </Text>
            <Text selectable style={[styles.totalAmount, { color: theme.title }]}>
              ${orderTotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalActions}>
            <View style={[styles.totalBadge, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#ffffff' }]}>
              <Text selectable style={[styles.totalBadgeText, { color: theme.amber }]}>
                {productCount} {productCount === 1 ? 'producto' : 'productos'}
              </Text>
            </View>
            <Pressable
              disabled={productCount === 0}
              onPress={() => setIsDetailOpen(true)}
              style={({ pressed }) => [
                styles.detailButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : '#ffffff',
                  opacity: productCount === 0 ? 0.45 : pressed ? 0.84 : 1,
                },
              ]}
            >
              <Text style={[styles.detailButtonText, { color: theme.amber }]}>Ver detalles</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            disabled={productCount === 0}
            onPress={() => setDecision('confirm')}
            style={({ pressed }) => [
              styles.confirmButton,
              {
                backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                opacity: productCount === 0 ? 0.45 : pressed ? 0.86 : 1,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>Confirmar pedido</Text>
          </Pressable>
          <Pressable
            onPress={() => setDecision('cancel')}
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#efe7e1',
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <Text style={[styles.cancelButtonText, { color: theme.title }]}>Cancelar</Text>
          </Pressable>
        </View>
      </View>

      <DecisionModal
        decision={decision}
        isSubmitting={isSubmitting}
        isDarkMode={isDarkMode}
        onCancel={() => setDecision(null)}
        onConfirm={handleDecisionConfirm}
        theme={theme}
      />
      <OrderDetailsModal
        isDarkMode={isDarkMode}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        products={selectedProducts}
        theme={theme}
        total={orderTotal}
      />
    </ScreenBackground>
  );
}

function QuantityButton({ disabled = false, isDarkMode, label, onPress, theme }) {
  return (
    <Pressable
      accessibilityLabel={label === '+' ? 'Agregar producto' : 'Quitar producto'}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quantityButton,
        {
          backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text style={styles.quantityButtonText}>{label}</Text>
    </Pressable>
  );
}

function OrderDetailsModal({ isDarkMode, isOpen, onClose, products, theme, total }) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
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
            Detalle del pedido
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            Productos agregados antes de confirmar.
          </Text>

          <View style={styles.detailList}>
            {products.map((product) => (
              <View key={product.name} style={[styles.detailRow, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#eeeeee' }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.softIcon }]}>
                  <AppIcon color={theme.amber} name={product.icon} size={19} />
                </View>
                <View style={styles.detailCopy}>
                  <Text selectable style={[styles.detailName, { color: theme.title }]}>
                    {product.name}
                  </Text>
                  <Text selectable style={[styles.detailMeta, { color: theme.muted }]}>
                    {product.quantity} x ${product.price.toFixed(2)}
                  </Text>
                </View>
                <Text selectable style={[styles.detailSubtotal, { color: theme.amber }]}>
                  ${(product.quantity * product.price).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.detailTotalBox, { backgroundColor: theme.actionSoft }]}>
            <Text selectable style={[styles.detailTotalLabel, { color: theme.muted }]}>
              Total
            </Text>
            <Text selectable style={[styles.detailTotalValue, { color: theme.title }]}>
              ${total.toFixed(2)}
            </Text>
          </View>

          <View style={styles.modalActions}>
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

function DecisionModal({ decision, isDarkMode, isSubmitting = false, onCancel, onConfirm, theme }) {
  const isConfirming = decision === 'confirm';

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(decision)}>
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
            {isConfirming ? 'Confirmar pedido' : 'Cancelar pedido'}
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            {isConfirming ? '¿Estás seguro de confirmar este pedido?' : '¿Estás seguro de cancelar este pedido?'}
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
              disabled={isSubmitting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalPrimary,
                {
                  backgroundColor: isConfirming ? (isDarkMode ? theme.accent : theme.accentAlt) : '#dc2626',
                  opacity: isSubmitting ? 0.6 : pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.modalPrimaryText}>{isSubmitting ? 'Guardando…' : 'Confirmar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 1220,
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
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 11,
  },
  tableBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: '22.8%',
  },
  tableText: {
    fontSize: 11,
    fontWeight: '900',
  },
  productList: {
    gap: 10,
    paddingTop: 12,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 10,
  },
  productCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  productLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 11,
    paddingRight: 10,
  },
  itemIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  itemIconText: {
    fontSize: 21,
  },
  productCopy: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '900',
  },
  productPrice: {
    fontSize: 11,
    paddingTop: 3,
  },
  quantityBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  quantityButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 10,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  quantityButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '900',
    minWidth: 12,
    textAlign: 'center',
  },
  observationsCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  observationInput: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  observationText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    minHeight: 34,
    outlineStyle: 'none',
    textAlignVertical: 'top',
  },
  totalCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 14,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    paddingTop: 3,
  },
  totalBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  totalActions: {
    alignItems: 'flex-end',
    gap: 7,
  },
  detailButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 11,
  },
  detailButtonText: {
    fontSize: 10,
    fontWeight: '900',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  confirmButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    width: 96,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '900',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  modalCopy: {
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 8,
  },
  detailList: {
    marginTop: 14,
  },
  detailRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 9,
  },
  detailIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  detailIconText: {
    fontSize: 17,
  },
  detailCopy: {
    flex: 1,
  },
  detailName: {
    fontSize: 12,
    fontWeight: '900',
  },
  detailMeta: {
    fontSize: 10,
    paddingTop: 3,
  },
  detailSubtotal: {
    fontSize: 12,
    fontWeight: '900',
  },
  detailTotalBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
  },
  detailTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailTotalValue: {
    fontSize: 16,
    fontWeight: '900',
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
});
