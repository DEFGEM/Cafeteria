import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useMemo, useState } from 'react';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import EmptyState from '../components/EmptyState';
import KitchenTabs from '../components/KitchenTabs';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';

const emptyItemDraft = {
  category: 'General',
  icon: '📦',
  minimum: '1',
  name: '',
  quantity: '0',
  unit: 'piezas',
};

const emptyPurchaseDraft = {
  amount: '',
  quantity: '',
  urgent: true,
};

export default function KitchenInventoryScreen({
  addCashierPurchase,
  addKitchenInventoryItem,
  cashierPurchases = [],
  currentRoleId,
  deleteKitchenInventoryItem,
  goBack,
  isDarkMode,
  kitchenInventory = [],
  navigate,
  recordEvent,
  setIsDarkMode,
  theme,
  updateKitchenInventoryItem,
}) {
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustMode, setAdjustMode] = useState('entry');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [itemDraft, setItemDraft] = useState(emptyItemDraft);
  const [itemFormError, setItemFormError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [purchaseDraft, setPurchaseDraft] = useState(emptyPurchaseDraft);
  const [purchaseError, setPurchaseError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [movements, setMovements] = useState([]);
  const [isMutating, setIsMutating] = useState(false);

  const inventory = kitchenInventory;
  const normalizedInventory = inventory.map(normalizeItem);
  const filteredInventory = normalizedInventory.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const lowStock = normalizedInventory.filter((item) => item.statusType === 'low');
  const normalStock = normalizedInventory.filter((item) => item.statusType === 'normal');
  const pendingPurchases = cashierPurchases.filter((purchase) => purchase.type === 'pending' || purchase.urgent);
  const canManagePurchases = currentRoleId === 'admin';
  const canDeleteItems = currentRoleId === 'admin';
  const stats = [
    { icon: '✅', value: String(normalStock.length), label: 'Normales' },
    { icon: '⚠️', value: String(lowStock.length), label: 'Stock bajo' },
    { icon: '🛒', value: String(pendingPurchases.length + lowStock.length), label: 'Comprar' },
  ];

  const recentPurchases = useMemo(
    () =>
      cashierPurchases
        .filter((purchase) => purchase.type === 'pending' || purchase.type === 'paid')
        .slice(0, 4),
    [cashierPurchases],
  );

  const addMovement = (movement) => {
    setMovements((currentMovements) => [movement, ...currentMovements].slice(0, 6));
  };

  const openNewItem = () => {
    setEditingItem(null);
    setItemDraft(emptyItemDraft);
    setItemFormError('');
    setIsItemSheetOpen(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setSelectedItem(null);
    setIsItemSheetOpen(true);
    setItemFormError('');
    setItemDraft({
      category: item.category,
      icon: item.icon,
      minimum: String(item.minimum),
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
    });
  };

  const closeItemSheet = () => {
    setEditingItem(null);
    setIsItemSheetOpen(false);
    setItemDraft(emptyItemDraft);
    setItemFormError('');
  };

  const saveItem = async () => {
    if (!itemDraft.name.trim()) {
      setItemFormError('Ingresa el nombre del insumo para guardarlo.');
      return;
    }

    if (Number(itemDraft.quantity || 0) < 0 || Number(itemDraft.minimum || 0) < 0) {
      setItemFormError('La cantidad y el mínimo no pueden ser negativos.');
      return;
    }

    const nextItem = {
      category: itemDraft.category.trim() || 'General',
      icon: itemDraft.icon.trim() || '📦',
      minimum: Number(itemDraft.minimum || 0),
      name: itemDraft.name.trim(),
      quantity: Number(itemDraft.quantity || 0),
      unit: itemDraft.unit.trim() || 'piezas',
      updatedAt: 'Ahora',
    };

    if (isMutating) return;
    setIsMutating(true);
    try {
    if (editingItem) {
      const updated = await updateKitchenInventoryItem?.(editingItem.id, (item) => ({ ...item, ...nextItem }));
      if (!updated) return;
      addMovement({ icon: '✏️', text: `${nextItem.name} actualizado en inventario` });
      recordEvent?.({
        detail: `${nextItem.name} fue editado en inventario.`,
        icon: '✏️',
        module: 'Inventario',
        severity: 'info',
        title: 'Insumo actualizado',
        type: 'activity',
      });
    } else {
      const created = await addKitchenInventoryItem?.({
        ...nextItem,
        id: `supply-${Date.now()}`,
      });
      if (!created) return;
      addMovement({ icon: '➕', text: `${nextItem.name} agregado al inventario` });
      recordEvent?.({
        detail: `${nextItem.name} quedó disponible con ${nextItem.quantity} ${nextItem.unit}.`,
        icon: '📦',
        module: 'Inventario',
        severity: 'success',
        title: 'Insumo agregado',
        type: 'activity',
      });
    }

    closeItemSheet();
    } finally {
      setIsMutating(false);
    }
  };

  const openAdjust = (item, mode = 'entry') => {
    setSelectedItem(null);
    setAdjustTarget(item);
    setAdjustMode(mode);
    setAdjustQuantity('');
    setAdjustReason('');
    setAdjustError('');
  };

  const closeAdjustSheet = () => {
    setAdjustTarget(null);
    setAdjustQuantity('');
    setAdjustReason('');
    setAdjustError('');
  };

  const saveAdjustment = async () => {
    const amount = Number(adjustQuantity || 0);

    if (!adjustTarget) {
      return;
    }

    if (amount <= 0) {
      setAdjustError('Ingresa una cantidad mayor a 0 para guardar el ajuste.');
      return;
    }

    if (isMutating) return;
    const direction = adjustMode === 'entry' ? 1 : -1;
    setIsMutating(true);
    try {
    const updated = await updateKitchenInventoryItem?.(adjustTarget.id, (item) => ({
      ...item,
      quantity: Math.max(0, Number(item.quantity || 0) + amount * direction),
      updatedAt: 'Ahora',
    }));
    if (!updated) return;
    addMovement({
      icon: adjustMode === 'entry' ? '📦' : '📉',
      text: `${adjustMode === 'entry' ? 'Entrada' : 'Salida'} de ${amount} ${adjustTarget.unit} en ${adjustTarget.name}${adjustReason ? `: ${adjustReason}` : ''}`,
    });
    recordEvent?.({
      detail: `${adjustMode === 'entry' ? 'Entrada' : 'Salida'} de ${amount} ${adjustTarget.unit} en ${adjustTarget.name}${adjustReason ? `: ${adjustReason}` : ''}.`,
      icon: adjustMode === 'entry' ? '📦' : '📉',
      module: 'Inventario',
      severity: adjustMode === 'entry' ? 'success' : 'info',
      title: 'Stock ajustado',
      type: 'activity',
    });
    closeAdjustSheet();
    } finally {
      setIsMutating(false);
    }
  };

  const openPurchase = (item) => {
    setSelectedItem(null);
    setPurchaseTarget(item);
    setPurchaseError('');
    setPurchaseDraft({
      ...emptyPurchaseDraft,
      quantity: String(Math.max(Number(item.minimum || 1) * 2 - Number(item.quantity || 0), 1)),
    });
  };

  const requestPurchase = async () => {
    if (!purchaseTarget || !canManagePurchases) {
      return;
    }

    if (Number(purchaseDraft.quantity || 0) <= 0) {
      setPurchaseError('Ingresa una cantidad mayor a 0 para solicitar la compra.');
      return;
    }

    if (Number(purchaseDraft.amount || 0) <= 0) {
      setPurchaseError('Agrega un costo estimado mayor a 0 para que caja pueda registrarlo.');
      return;
    }

    const purchase = {
      amount: Number(purchaseDraft.amount || 0),
      detail: `${purchaseDraft.quantity} ${purchaseTarget.unit} · Solicitado por cocina`,
      icon: purchaseTarget.icon,
      id: `purchase-request-${Date.now()}`,
      inventoryItemId: purchaseTarget.id,
      name: purchaseTarget.name,
      quantity: String(purchaseDraft.quantity),
      status: 'Pendiente',
      type: 'pending',
      unit: purchaseTarget.unit,
      urgent: Boolean(purchaseDraft.urgent),
    };

    if (isMutating) return;
    setIsMutating(true);
    try {
    const created = await addCashierPurchase?.(purchase);
    if (!created) return;
    addMovement({ icon: '🛒', text: `Solicitud enviada a caja: ${purchaseTarget.name}` });
    recordEvent?.({
      detail: `${purchaseTarget.name}: ${purchaseDraft.quantity} ${purchaseTarget.unit} solicitado a caja por $${Number(purchaseDraft.amount || 0).toFixed(2)}.`,
      icon: '🛒',
      module: 'Inventario',
      severity: purchase.urgent ? 'warning' : 'info',
      title: 'Compra solicitada',
      type: 'notification',
    });
    setPurchaseTarget(null);
    setPurchaseDraft(emptyPurchaseDraft);
    setPurchaseError('');
    } finally {
      setIsMutating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !canDeleteItems || isMutating) {
      return;
    }

    setIsMutating(true);
    try {
    const deleted = await deleteKitchenInventoryItem?.(deleteTarget.id);
    if (!deleted) return;
    addMovement({ icon: '🗑️', text: `${deleteTarget.name} eliminado del inventario` });
    recordEvent?.({
      detail: `${deleteTarget.name} fue eliminado del inventario.`,
      icon: '🗑️',
      module: 'Inventario',
      severity: 'warning',
      title: 'Insumo eliminado',
      type: 'activity',
    });
    setDeleteTarget(null);
    setSelectedItem(null);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <AppHeader
          eyebrow="Cocina"
          title="Inventario"
          subtitle="Control de insumos y existencias"
          icon="📦"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <KitchenTabs active="kitchenInventory" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Estado del inventario"
          amount={`${normalizedInventory.length} insumos`}
          subtitle={`${lowStock.length} productos con stock bajo · sincronizado con compras`}
          icon="⚠️"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              boxShadow: theme.cardShadow,
            },
          ]}
        >
          <AppIcon color={theme.muted} name="search" size={18} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Buscar insumo..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.title }]}
            value={query}
          />
        </View>

        <SectionTitle title="Insumos principales" subtitle="Toca un insumo para gestionar existencias" compact theme={theme} />

        <View style={styles.inventoryList}>
          {filteredInventory.length ? (
            filteredInventory.map((item) => (
              <InventoryCard key={item.id} isDarkMode={isDarkMode} item={item} onPress={() => setSelectedItem(item)} theme={theme} />
            ))
          ) : (
            <EmptyState
              actionLabel={query ? 'Limpiar búsqueda' : 'Agregar insumo'}
              icon="📦"
              onAction={query ? () => setQuery('') : openNewItem}
              subtitle={query ? 'No encontramos insumos con ese nombre.' : 'Agrega insumos para controlar entradas, salidas y compras.'}
              theme={theme}
              title={query ? 'Sin resultados' : 'Inventario vacío'}
            />
          )}
        </View>

        <View style={styles.quickGrid}>
          <QuickCard action={{ icon: '➕', title: 'Agregar', description: 'Nuevo insumo' }} isDarkMode={isDarkMode} onPress={openNewItem} theme={theme} />
          {canManagePurchases ? (
            <QuickCard
              action={{ icon: '🛒', title: 'Compra', description: 'Registrar solicitud' }}
              isDarkMode={isDarkMode}
              onPress={() => openPurchase(lowStock[0] || normalizedInventory[0])}
              theme={theme}
            />
          ) : null}
        </View>

        {recentPurchases.length ? (
          <>
            <SectionTitle title="Compras desde caja" subtitle="Las compras recibidas actualizan el stock automáticamente" compact theme={theme} />
            <View style={styles.purchaseList}>
              {recentPurchases.map((purchase) => (
                <PurchaseSyncCard
                  key={purchase.id}
                  isDarkMode={isDarkMode}
                  purchase={purchase}
                  theme={theme}
                />
              ))}
            </View>
          </>
        ) : null}

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

          {movements.map((movement, index) => (
            <View key={`${movement.text}-${index}`} style={styles.movementItem}>
              <AppIcon color={theme.amber} name={movement.icon} size={18} />
              <Text selectable style={[styles.movementCopy, { color: theme.muted }]}>
                {movement.text}
              </Text>
            </View>
          ))}
        </View>
      </View>


      <ItemActionsSheet
        isDarkMode={isDarkMode}
        item={selectedItem}
        onAdjust={openAdjust}
        canDelete={canDeleteItems}
        canPurchase={canManagePurchases}
        onClose={() => setSelectedItem(null)}
        onDelete={(item) => setDeleteTarget(item)}
        onEdit={openEditItem}
        onPurchase={openPurchase}
        theme={theme}
      />
      <AdjustStockSheet
        error={adjustError}
        isDarkMode={isDarkMode}
        mode={adjustMode}
        onCancel={closeAdjustSheet}
        onChangeMode={setAdjustMode}
        onChangeQuantity={(value) => {
          setAdjustQuantity(value);
          setAdjustError('');
        }}
        onChangeReason={setAdjustReason}
        onSave={saveAdjustment}
        quantity={adjustQuantity}
        reason={adjustReason}
        target={adjustTarget}
        theme={theme}
      />
      <ItemFormSheet
        draft={itemDraft}
        error={itemFormError}
        isDarkMode={isDarkMode}
        isOpen={isItemSheetOpen}
        onCancel={closeItemSheet}
        onChange={(changes) => setItemDraft((currentDraft) => ({ ...currentDraft, ...changes }))}
        onSave={saveItem}
        title={editingItem ? 'Editar insumo' : 'Agregar insumo'}
        theme={theme}
      />
      <PurchaseRequestSheet
        draft={purchaseDraft}
        error={purchaseError}
        isDarkMode={isDarkMode}
        item={canManagePurchases ? purchaseTarget : null}
        onCancel={() => {
          setPurchaseTarget(null);
          setPurchaseError('');
        }}
        onChange={(changes) => {
          setPurchaseError('');
          setPurchaseDraft((currentDraft) => ({ ...currentDraft, ...changes }));
        }}
        onSave={requestPurchase}
        theme={theme}
      />
      <DeleteItemModal
        isDarkMode={isDarkMode}
        item={canDeleteItems ? deleteTarget : null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        theme={theme}
      />
    </ScreenBackground>
  );
}

function normalizeItem(item) {
  const quantity = Number(item.quantity || 0);
  const minimum = Number(item.minimum || 0);
  const isLow = quantity <= minimum;

  return {
    ...item,
    minimum,
    quantity,
    status: isLow ? 'Bajo' : 'Normal',
    statusType: isLow ? 'low' : 'normal',
  };
}

function InventoryCard({ isDarkMode, item, onPress, theme }) {
  const isNormal = item.statusType === 'normal';
  const badgeBg = isNormal ? (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7') : theme.progressBg;
  const badgeText = isNormal ? (isDarkMode ? '#86efac' : '#166534') : theme.progressText;
  const progress = Math.min(100, Math.round((item.quantity / Math.max(item.minimum, 1)) * 100));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.inventoryCard,
        {
          backgroundColor: theme.surface,
          borderColor: item.statusType === 'low' ? theme.progressText : theme.surfaceBorder,
          boxShadow: theme.cardShadow,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <View style={styles.inventoryLeft}>
        <View style={[styles.itemIcon, { backgroundColor: theme.softIcon }]}>
          <AppIcon color={theme.amber} name={item.icon} size={22} />
        </View>
        <View style={styles.itemCopy}>
          <Text selectable style={[styles.itemName, { color: theme.title }]}>
            {item.name}
          </Text>
          <Text selectable style={[styles.itemQuantity, { color: theme.muted }]}>
            {formatQuantity(item)} disponibles
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1e7de' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: item.statusType === 'low' ? theme.progressText : '#16a34a',
                  width: `${Math.max(12, Math.min(progress, 100))}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.inventoryRight}>
        <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.25)' : 'transparent' }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>{item.status}</Text>
        </View>
        <Text selectable style={[styles.minimumText, { color: theme.muted }]}>
          Mín: {item.minimum} {item.unit}
        </Text>
      </View>
    </Pressable>
  );
}

function QuickCard({ action, isDarkMode, onPress, theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickCard,
        {
          backgroundColor: theme.surfaceAlt,
          borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(120, 53, 15, 0)',
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.10)' : '#ffffff' }]}>
        <AppIcon color={theme.amber} name={action.icon} size={21} />
      </View>
      <View>
        <Text selectable style={[styles.quickTitle, { color: theme.title }]}>
          {action.title}
        </Text>
        <Text selectable style={[styles.quickCopy, { color: theme.muted }]}>
          {action.description}
        </Text>
      </View>
    </Pressable>
  );
}

function PurchaseSyncCard({ isDarkMode, purchase, theme }) {
  const isPending = purchase.type === 'pending';
  const isCancelled = purchase.type === 'cancelled';

  return (
    <View
      style={[
        styles.purchaseCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
        },
      ]}
    >
      <View style={styles.purchaseLeft}>
        <View style={[styles.purchaseIcon, { backgroundColor: theme.softIcon }]}>
          <AppIcon color={theme.amber} name={purchase.icon || 'cube'} size={20} />
        </View>
        <View style={styles.purchaseCopy}>
          <Text selectable style={[styles.purchaseName, { color: theme.title }]}>
            {purchase.name}
          </Text>
          <Text selectable style={[styles.purchaseDetail, { color: theme.muted }]}>
            {purchase.quantity} {purchase.unit} · {isPending ? 'Pendiente en caja' : isCancelled ? 'Cancelada' : 'Stock actualizado'}
          </Text>
        </View>
      </View>

        <View style={[styles.purchaseBadge, { backgroundColor: isPending ? theme.warningBg : theme.actionSoft }]}>
          <Text style={[styles.purchaseBadgeText, { color: isPending ? theme.warningText : theme.amber }]}>
            {isPending ? 'Pendiente' : isCancelled ? 'Cancelada' : 'Recibida'}
          </Text>
        </View>
    </View>
  );
}

function ItemActionsSheet({ canDelete, canPurchase, isDarkMode, item, onAdjust, onClose, onDelete, onEdit, onPurchase, theme }) {
  if (!item) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={Boolean(item)}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetCard, getModalSurface(isDarkMode, theme)]}>
          <View style={[styles.sheetGrabber, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.18)' : '#d6d3d1' }]} />
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIcon, { backgroundColor: theme.softIcon }]}>
              <AppIcon color={theme.amber} name={item.icon} size={22} />
            </View>
            <View style={styles.sheetTitleWrap}>
              <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
                {item.name}
              </Text>
              <Text selectable style={[styles.sheetCopy, { color: theme.muted }]}>
                {formatQuantity(item)} disponibles · Mínimo {item.minimum} {item.unit}
              </Text>
            </View>
          </View>

          <View style={styles.sheetActionsGrid}>
            <ActionButton label="Entrada" onPress={() => onAdjust(item, 'entry')} theme={theme} />
            <ActionButton label="Salida" onPress={() => onAdjust(item, 'out')} theme={theme} />
            {canPurchase ? <ActionButton label="Registrar compra" onPress={() => onPurchase(item)} theme={theme} /> : null}
            <ActionButton label="Editar" onPress={() => onEdit(item)} theme={theme} />
          </View>

          <View style={styles.modalActions}>
            {canDelete ? (
              <Pressable onPress={() => onDelete(item)} style={[styles.modalSecondary, { backgroundColor: '#dc2626' }]}>
                <Text style={styles.modalPrimaryText}>Eliminar</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} style={[styles.modalPrimary, { backgroundColor: theme.accent }]}>
              <Text style={styles.modalPrimaryText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AdjustStockSheet({ error, isDarkMode, mode, onCancel, onChangeMode, onChangeQuantity, onChangeReason, onSave, quantity, reason, target, theme }) {
  if (!target) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={Boolean(target)}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetCard, getModalSurface(isDarkMode, theme)]}>
          <View style={[styles.sheetGrabber, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.18)' : '#d6d3d1' }]} />
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            Ajustar stock
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            {target.name} · actual {formatQuantity(target)}
          </Text>
          <View style={styles.segmentRow}>
            {[
              { label: 'Entrada', value: 'entry' },
              { label: 'Salida', value: 'out' },
            ].map((option) => (
              <Pressable
                key={option.value}
                onPress={() => onChangeMode(option.value)}
                style={[styles.segmentButton, { backgroundColor: mode === option.value ? theme.accent : theme.actionSoft }]}
              >
                <Text style={[styles.segmentText, { color: mode === option.value ? '#ffffff' : theme.amber }]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <FormInput keyboardType="numeric" label={`Cantidad (${target.unit})`} onChangeText={onChangeQuantity} theme={theme} value={quantity} />
          {error ? (
            <Text selectable style={styles.formError}>
              {error}
            </Text>
          ) : null}
          <FormInput label="Motivo" onChangeText={onChangeReason} theme={theme} value={reason} />
          <View style={styles.modalActions}>
            <SheetSecondaryButton isDarkMode={isDarkMode} label="Cancelar" onPress={onCancel} theme={theme} />
            <SheetPrimaryButton label="Guardar" onPress={onSave} theme={theme} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ItemFormSheet({ draft, error, isDarkMode, isOpen, onCancel, onChange, onSave, theme, title }) {
  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={isOpen}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetCard, getModalSurface(isDarkMode, theme)]}>
          <View style={[styles.sheetGrabber, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.18)' : '#d6d3d1' }]} />
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            {title}
          </Text>
          <View style={styles.formGrid}>
            <FormInput label="Nombre" onChangeText={(value) => onChange({ name: value })} theme={theme} value={draft.name} />
            <FormInput label="Icono" onChangeText={(value) => onChange({ icon: value })} theme={theme} value={draft.icon} />
            <FormInput keyboardType="numeric" label="Cantidad" onChangeText={(value) => onChange({ quantity: value })} theme={theme} value={draft.quantity} />
            <FormInput label="Unidad" onChangeText={(value) => onChange({ unit: value })} theme={theme} value={draft.unit} />
            <FormInput keyboardType="numeric" label="Mínimo" onChangeText={(value) => onChange({ minimum: value })} theme={theme} value={draft.minimum} />
            <FormInput label="Categoría" onChangeText={(value) => onChange({ category: value })} theme={theme} value={draft.category} />
          </View>
          {error ? (
            <Text selectable style={styles.formError}>
              {error}
            </Text>
          ) : null}
          <View style={styles.modalActions}>
            <SheetSecondaryButton isDarkMode={isDarkMode} label="Cancelar" onPress={onCancel} theme={theme} />
            <SheetPrimaryButton label="Guardar" onPress={onSave} theme={theme} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PurchaseRequestSheet({ draft, error, isDarkMode, item, onCancel, onChange, onSave, theme }) {
  if (!item) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={Boolean(item)}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetCard, getModalSurface(isDarkMode, theme)]}>
          <View style={[styles.sheetGrabber, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.18)' : '#d6d3d1' }]} />
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            Solicitar compra
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            Se enviará a Caja como compra pendiente.
          </Text>
          <View style={[styles.requestItemBox, { backgroundColor: theme.actionSoft }]}>
            <AppIcon color={theme.amber} name={item.icon} size={20} />
            <Text selectable style={[styles.requestText, { color: theme.title }]}>
              {item.name} · disponible {formatQuantity(item)}
            </Text>
          </View>
          <FormInput keyboardType="numeric" label={`Cantidad a comprar (${item.unit})`} onChangeText={(value) => onChange({ quantity: value })} theme={theme} value={draft.quantity} />
          <FormInput keyboardType="numeric" label="Costo estimado" onChangeText={(value) => onChange({ amount: value })} theme={theme} value={draft.amount} />
          {error ? (
            <Text selectable style={styles.formError}>
              {error}
            </Text>
          ) : null}
          <Pressable
            onPress={() => onChange({ urgent: !draft.urgent })}
            style={[styles.urgentToggle, { backgroundColor: draft.urgent ? theme.warningBg : theme.actionSoft }]}
          >
            <Text style={[styles.urgentText, { color: draft.urgent ? theme.warningText : theme.amber }]}>
              {draft.urgent ? 'Compra urgente' : 'Marcar como urgente'}
            </Text>
          </Pressable>
          <View style={styles.modalActions}>
            <SheetSecondaryButton isDarkMode={isDarkMode} label="Cancelar" onPress={onCancel} theme={theme} />
            <SheetPrimaryButton label="Enviar a caja" onPress={onSave} theme={theme} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteItemModal({ isDarkMode, item, onCancel, onConfirm, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(item)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, getModalSurface(isDarkMode, theme)]}>
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            Eliminar insumo
          </Text>
          <Text selectable style={[styles.modalCopy, { color: theme.muted }]}>
            ¿Seguro que deseas eliminar {item?.name} del inventario?
          </Text>
          <View style={styles.modalActions}>
            <SheetSecondaryButton isDarkMode={isDarkMode} label="Cancelar" onPress={onCancel} theme={theme} />
            <Pressable onPress={onConfirm} style={[styles.modalPrimary, { backgroundColor: '#dc2626' }]}>
              <Text style={styles.modalPrimaryText}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ActionButton({ label, onPress, theme }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionOption, { backgroundColor: theme.actionSoft }]}>
      <Text style={[styles.actionOptionText, { color: theme.amber }]}>{label}</Text>
    </Pressable>
  );
}

function FormInput({ keyboardType = 'default', label, onChangeText, theme, value }) {
  return (
    <View style={[styles.formInputWrap, { backgroundColor: theme.actionSoft }]}>
      <Text selectable style={[styles.formLabel, { color: theme.muted }]}>
        {label}
      </Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={theme.muted}
        style={[styles.formInput, { color: theme.title }]}
        value={value}
      />
    </View>
  );
}

function SheetSecondaryButton({ isDarkMode, label, onPress, theme }) {
  return (
    <Pressable onPress={onPress} style={[styles.modalSecondary, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#efe7e1' }]}>
      <Text style={[styles.modalSecondaryText, { color: theme.title }]}>{label}</Text>
    </Pressable>
  );
}

function SheetPrimaryButton({ label, onPress, theme }) {
  return (
    <Pressable onPress={onPress} style={[styles.modalPrimary, { backgroundColor: theme.accent }]}>
      <Text style={styles.modalPrimaryText}>{label}</Text>
    </Pressable>
  );
}

function getModalSurface(isDarkMode, theme) {
  return {
    backgroundColor: isDarkMode ? '#231811' : '#ffffff',
    borderColor: theme.surfaceBorder,
    boxShadow: isDarkMode ? '0 18px 42px rgba(0,0,0,0.55)' : '0 18px 42px rgba(0,0,0,0.20)',
  };
}

function formatQuantity(item) {
  return `${Number(item.quantity || 0)} ${item.unit}`;
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 1180,
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
    fontWeight: '700',
    outlineStyle: 'none',
  },
  inventoryList: {
    gap: 10,
    paddingTop: 12,
  },
  inventoryCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 13,
  },
  inventoryLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 22,
  },
  itemCopy: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '900',
  },
  itemQuantity: {
    fontSize: 11,
    paddingTop: 4,
  },
  progressTrack: {
    borderRadius: 999,
    height: 6,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: 6,
  },
  inventoryRight: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  minimumText: {
    fontSize: 10,
    paddingTop: 5,
    textAlign: 'right',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  quickCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 13,
  },
  quickIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  quickIconText: {
    fontSize: 18,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  quickCopy: {
    fontSize: 10,
    paddingTop: 3,
  },
  purchaseList: {
    gap: 10,
    paddingTop: 12,
  },
  purchaseCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 12,
  },
  purchaseLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  purchaseIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 13,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  purchaseIconText: {
    fontSize: 18,
  },
  purchaseCopy: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 12,
    fontWeight: '900',
  },
  purchaseDetail: {
    fontSize: 10,
    lineHeight: 14,
    paddingTop: 3,
  },
  applyButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 10,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  purchaseBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  purchaseBadgeText: {
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
  sheetOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 22,
  },
  sheetGrabber: {
    alignSelf: 'center',
    borderRadius: 20,
    height: 5,
    marginBottom: 16,
    width: 46,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  sheetIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  sheetIconText: {
    fontSize: 28,
  },
  sheetTitleWrap: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sheetCopy: {
    fontSize: 12,
    lineHeight: 17,
    paddingTop: 5,
  },
  sheetActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  actionOption: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flexBasis: '48%',
    flexGrow: 1,
    height: 42,
    justifyContent: 'center',
  },
  actionOptionText: {
    fontSize: 11,
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
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  segmentButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '900',
  },
  formGrid: {
    gap: 10,
    marginTop: 14,
  },
  formInputWrap: {
    borderCurve: 'continuous',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  formInput: {
    fontSize: 13,
    fontWeight: '800',
    minHeight: 28,
    outlineStyle: 'none',
    paddingTop: 3,
  },
  formError: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
  },
  requestItemBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    padding: 12,
  },
  requestIcon: {
    fontSize: 22,
  },
  requestText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  urgentToggle: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    marginTop: 10,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
