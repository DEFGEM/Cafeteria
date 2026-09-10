import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useState } from 'react';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import CashierTabs from '../components/CashierTabs';
import EmptyState from '../components/EmptyState';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';

const defaultDraft = {
  amount: '',
  icon: '📦',
  inventoryItemId: null,
  name: '',
  quantity: '',
  status: 'Registrada',
  type: 'paid',
  unit: 'piezas',
  urgent: false,
};

export default function CashierPurchasesScreen({
  addCashierPurchase,
  cashierPurchases = [],
  currentRoleId,
  deleteCashierPurchase,
  goBack,
  isDarkMode,
  kitchenInventory = [],
  setIsDarkMode,
  theme,
  navigate,
  recordEvent,
  updateCashierPurchase,
}) {
  const [draft, setDraft] = useState(defaultDraft);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [movements, setMovements] = useState([]);
  const [isMutating, setIsMutating] = useState(false);

  const supplySuggestions = kitchenInventory.map((item) => ({
    icon: item.icon || '📦',
    inventoryItemId: item.id,
    name: item.name,
    unit: item.unit || 'piezas',
  }));

  const purchaseTotal = cashierPurchases
    .filter((purchase) => purchase.type !== 'cancelled')
    .reduce((total, purchase) => total + Number(purchase.amount || 0), 0);
  const registeredTotal = cashierPurchases
    .filter((purchase) => purchase.type === 'paid')
    .reduce((total, purchase) => total + Number(purchase.amount || 0), 0);
  const urgentCount = cashierPurchases.filter((purchase) => purchase.urgent || purchase.type === 'pending').length;
  const uniqueSupplies = new Set(cashierPurchases.map((purchase) => purchase.name)).size;
  const stats = [
    { icon: '🛒', value: String(cashierPurchases.length), label: 'Compras' },
    { icon: '📦', value: String(uniqueSupplies), label: 'Insumos' },
    { icon: '⚠️', value: String(urgentCount), label: 'Urgentes' },
  ];
  const canRegister = Boolean(draft.name.trim())
    && (Boolean(draft.inventoryItemId) || currentRoleId === 'admin')
    && Number(draft.amount) > 0
    && Number(draft.quantity) > 0;

  const updateDraft = (changes) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...changes }));
  };

  const chooseSupply = (supply) => {
    updateDraft({ icon: supply.icon, inventoryItemId: supply.inventoryItemId, name: supply.name, unit: supply.unit });
  };

  const resetDraft = () => {
    setDraft(defaultDraft);
    setEditingPurchase(null);
  };

  const buildPurchaseFromDraft = (sourceDraft, purchaseId = `purchase-${Date.now()}`) => {
    const amount = Number(sourceDraft.amount || 0);
    const quantity = Number(sourceDraft.quantity || 0);
    const type = sourceDraft.type || (sourceDraft.status === 'Pendiente' ? 'pending' : 'paid');

    return {
      id: purchaseId,
      amount,
      detail: `${quantity} ${sourceDraft.unit} · Hoy`,
      icon: sourceDraft.icon || '📦',
      inventoryItemId: sourceDraft.inventoryItemId,
      name: sourceDraft.name.trim(),
      quantity: String(quantity),
      status: type === 'paid' ? 'Registrada' : 'Pendiente',
      type,
      unit: sourceDraft.unit.trim() || 'piezas',
      urgent: Boolean(sourceDraft.urgent),
    };
  };

  const openConfirm = () => {
    if (canRegister) {
      setIsConfirmOpen(true);
    }
  };

  const confirmNewPurchase = async () => {
    if (isMutating) return;
    const purchase = buildPurchaseFromDraft(draft);
    setIsMutating(true);
    try {
    const created = await addCashierPurchase(purchase);
    if (!created) return;
    setMovements((currentMovements) => [
      { icon: '🛒', text: `${purchase.name} registrada por ${formatCurrency(purchase.amount)}` },
      ...currentMovements,
    ]);
    recordEvent?.({
      detail: `${purchase.name} por ${formatCurrency(purchase.amount)} quedó ${purchase.type === 'paid' ? 'recibida' : 'pendiente'}.`,
      icon: '🛒',
      module: 'Caja',
      severity: purchase.type === 'paid' ? 'success' : 'warning',
      title: 'Compra registrada',
      type: 'notification',
    });
    setIsConfirmOpen(false);
    resetDraft();
    } finally {
      setIsMutating(false);
    }
  };

  const openDetail = (purchase) => {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  };

  const openEdit = (purchase) => {
    if (purchase.type !== 'pending') return;
    setEditingPurchase(purchase);
    setDraft({
      amount: String(purchase.amount),
      icon: purchase.icon,
      inventoryItemId: purchase.inventoryItemId,
      name: purchase.name,
      quantity: String(purchase.quantity),
      status: purchase.status,
      type: purchase.type,
      unit: purchase.unit,
      urgent: Boolean(purchase.urgent),
    });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    resetDraft();
  };

  const saveEditedPurchase = async () => {
    if (!editingPurchase || editingPurchase.type !== 'pending' || !canRegister || isMutating) {
      return;
    }

    const nextPurchase = buildPurchaseFromDraft(draft, editingPurchase.id);
    setIsMutating(true);
    try {
    const updated = await updateCashierPurchase(editingPurchase.id, (purchase) => ({ ...purchase, ...nextPurchase }));
    if (!updated) return;

    setMovements((currentMovements) => [
      { icon: '✏️', text: `Compra editada: ${nextPurchase.name}` },
      ...currentMovements,
    ]);
    recordEvent?.({
      detail: `${nextPurchase.name} se editó por ${formatCurrency(nextPurchase.amount)}.`,
      icon: '✏️',
      module: 'Caja',
      severity: 'info',
      title: 'Compra editada',
      type: 'activity',
    });
    closeEdit();
    } finally {
      setIsMutating(false);
    }
  };

  const markRegistered = async (purchase) => {
    if (purchase.type !== 'pending' || isMutating) return;
    setIsMutating(true);
    try {
    const updated = await updateCashierPurchase(purchase.id, (currentPurchase) => ({
      ...currentPurchase,
      status: 'Registrada',
      type: 'paid',
      urgent: false,
    }));
    if (!updated) return;

    setMovements((currentMovements) => [
      { icon: '✅', text: `${purchase.name} marcada como registrada` },
      ...currentMovements,
    ]);
    recordEvent?.({
      detail: `${purchase.name} pasó de pendiente a registrada por ${formatCurrency(purchase.amount)}.`,
      icon: '✅',
      module: 'Caja',
      severity: 'success',
      title: 'Compra confirmada',
      type: 'notification',
    });
    setIsDetailOpen(false);
    } finally {
      setIsMutating(false);
    }
  };

  const openDelete = (purchase) => {
    setDeleteTarget(purchase);
    setIsDeleteOpen(true);
  };

  const closeDelete = () => {
    setDeleteTarget(null);
    setIsDeleteOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteTarget.type !== 'pending' || isMutating) {
      return;
    }

    setIsMutating(true);
    try {
    const cancelled = await deleteCashierPurchase(deleteTarget.id);
    if (!cancelled) return;
    setMovements((currentMovements) => [
      { icon: '🗑️', text: `Compra eliminada: ${deleteTarget.name}` },
      ...currentMovements,
    ]);
    recordEvent?.({
      detail: `${deleteTarget.name} fue cancelada en compras.`,
      icon: '🗑️',
      module: 'Caja',
      severity: 'warning',
      title: 'Compra eliminada',
      type: 'activity',
    });
    closeDelete();
    setIsDetailOpen(false);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <AppHeader
          eyebrow="Caja"
          title="Compras"
          subtitle="Compra de suministros e insumos"
          icon="🛒"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <CashierTabs active="cashierPurchases" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Gasto en suministros"
          amount={formatCurrency(purchaseTotal)}
          subtitle={`${formatCurrency(registeredTotal)} en compras recibidas`}
          icon="📦"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        <SectionTitle title="Nueva compra" subtitle="Registra los suministros comprados" compact theme={theme} />

        <View
          style={[
            styles.formCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              boxShadow: theme.cardShadow,
            },
          ]}
        >
          <View style={styles.suggestionRow}>
            {supplySuggestions.map((supply) => {
              const active = draft.name === supply.name;

              return (
                <Pressable
                  key={supply.name}
                  onPress={() => chooseSupply(supply)}
                  style={({ pressed }) => [
                    styles.supplyChip,
                    {
                      backgroundColor: active ? theme.accent : isDarkMode ? 'rgba(255,255,255,0.08)' : theme.actionSoft,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <AppIcon color={theme.amber} name={supply.icon} size={18} />
                </Pressable>
              );
            })}
          </View>

          <FormInput
            editable={currentRoleId === 'admin'}
            icon={draft.icon}
            isDarkMode={isDarkMode}
            label={currentRoleId === 'admin' ? 'Seleccionar o crear insumo' : 'Seleccionar insumo'}
            onChangeText={(name) => updateDraft({ name })}
            placeholder="Ej. Leche"
            theme={theme}
            value={draft.name}
          />

          <View style={styles.inputRow}>
            <FormInput
              icon="🔢"
              isDarkMode={isDarkMode}
              keyboardType="numeric"
              label="Cantidad"
              onChangeText={(quantity) => updateDraft({ quantity })}
              placeholder="0"
              small
              theme={theme}
              value={draft.quantity}
            />
            <FormInput
              icon="⚖️"
              isDarkMode={isDarkMode}
              label="Unidad"
              onChangeText={(unit) => updateDraft({ unit })}
              placeholder="piezas"
              small
              theme={theme}
              value={draft.unit}
            />
          </View>

          <FormInput
            icon="💵"
            isDarkMode={isDarkMode}
            keyboardType="numeric"
            label="Costo total"
            onChangeText={(amount) => updateDraft({ amount })}
            placeholder="0.00"
            theme={theme}
            value={draft.amount}
          />

          <View style={styles.statusRow}>
            <StatusChip
              active={draft.type === 'paid'}
              isDarkMode={isDarkMode}
              label="Recibida"
              onPress={() => updateDraft({ status: 'Recibida', type: 'paid' })}
              theme={theme}
            />
            <StatusChip
              active={draft.type === 'pending'}
              isDarkMode={isDarkMode}
              label="Pendiente"
              onPress={() => updateDraft({ status: 'Pendiente', type: 'pending' })}
              theme={theme}
            />
            <StatusChip
              active={draft.urgent}
              isDarkMode={isDarkMode}
              label="Urgente"
              onPress={() => updateDraft({ urgent: !draft.urgent })}
              theme={theme}
              warning
            />
          </View>

          <Pressable
            disabled={!canRegister}
            onPress={openConfirm}
            style={({ pressed }) => [
              styles.registerButton,
              {
                backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                boxShadow: isDarkMode ? '0 8px 18px rgba(217, 119, 6, 0.25)' : 'none',
                opacity: !canRegister ? 0.45 : pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text style={styles.registerText}>Registrar compra</Text>
          </Pressable>
          {!canRegister ? (
            <Text selectable style={styles.formError}>
              Completa insumo, cantidad y costo mayor a 0 para registrar la compra.
            </Text>
          ) : null}
        </View>

        <View style={styles.smallTitle}>
          <Text selectable style={[styles.smallHeading, { color: theme.title }]}>
            Compras recientes
          </Text>
        </View>

        <View style={styles.purchaseList}>
          {cashierPurchases.length ? (
            cashierPurchases.map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                isDarkMode={isDarkMode}
                onDelete={openDelete}
                onDetail={openDetail}
                onEdit={openEdit}
                onRegister={markRegistered}
                purchase={purchase}
                theme={theme}
              />
            ))
          ) : (
            <EmptyState
              icon="🛒"
              subtitle="Las compras registradas por caja o solicitadas desde cocina aparecerán aquí."
              theme={theme}
              title="Sin compras recientes"
            />
          )}
        </View>

        <MovementCard movements={movements} theme={theme} />
      </View>


      <ConfirmPurchaseModal
        draft={draft}
        isDarkMode={isDarkMode}
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={confirmNewPurchase}
        theme={theme}
      />
      <PurchaseEditSheet
        draft={draft}
        isDarkMode={isDarkMode}
        isOpen={isEditOpen}
        onCancel={closeEdit}
        onChange={updateDraft}
        onSave={saveEditedPurchase}
        theme={theme}
      />
      <PurchaseDetailModal
        isDarkMode={isDarkMode}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onDelete={openDelete}
        onEdit={openEdit}
        onRegister={markRegistered}
        purchase={selectedPurchase}
        theme={theme}
      />
      <DeletePurchaseModal
        isDarkMode={isDarkMode}
        isOpen={isDeleteOpen}
        onCancel={closeDelete}
        onConfirm={confirmDelete}
        purchase={deleteTarget}
        theme={theme}
      />
    </ScreenBackground>
  );
}

function FormInput({ editable = true, icon, isDarkMode, keyboardType = 'default', label, onChangeText, placeholder, small, theme, value }) {
  return (
    <View
      style={[
        styles.inputBox,
        small && styles.inputSmall,
        {
          backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.10)' : theme.actionSoft,
          borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
        },
      ]}
    >
      <AppIcon color={theme.amber} name={icon} size={18} />
      <View style={styles.inputCopy}>
        <Text selectable style={[styles.inputText, { color: theme.muted }]}>
          {label}
        </Text>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.title }]}
          value={value}
        />
      </View>
    </View>
  );
}

function StatusChip({ active, isDarkMode, label, onPress, theme, warning = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statusChip,
        {
          backgroundColor: active
            ? warning
              ? theme.warningBg
              : theme.accent
            : isDarkMode
              ? 'rgba(255,255,255,0.08)'
              : '#f3eee9',
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text style={[styles.statusChipText, { color: active ? (warning ? theme.warningText : '#ffffff') : theme.muted }]}>{label}</Text>
    </Pressable>
  );
}

function PurchaseCard({ isDarkMode, onDelete, onDetail, onEdit, onRegister, purchase, theme }) {
  const pending = purchase.type === 'pending';
  const badge = getPurchaseBadge(purchase, isDarkMode, theme);

  return (
    <View
      style={[
        styles.purchaseCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <View style={styles.purchaseMain}>
        <View style={styles.purchaseLeft}>
          <View style={[styles.itemIcon, { backgroundColor: theme.softIcon }]}>
            <AppIcon color={theme.amber} name={purchase.icon} size={21} />
          </View>
          <View style={styles.purchaseCopy}>
            <Text selectable style={[styles.purchaseName, { color: theme.title }]}>
              {purchase.name}
            </Text>
            <Text selectable style={[styles.purchaseDetail, { color: theme.muted }]}>
              {purchase.detail}
            </Text>
          </View>
        </View>

        <View style={styles.purchaseRight}>
          <Text selectable style={[styles.purchaseAmount, { color: theme.amber }]}>
            {formatCurrency(purchase.amount)}
          </Text>
          <View style={[styles.purchaseBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.purchaseBadgeText, { color: badge.text }]}>{purchase.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <SmallAction isDarkMode={isDarkMode} label="Detalle" onPress={() => onDetail(purchase)} theme={theme} />
        {pending ? <SmallAction isDarkMode={isDarkMode} label="Editar" onPress={() => onEdit(purchase)} theme={theme} /> : null}
        {pending ? <SmallAction isDarkMode={isDarkMode} label="Recibir" onPress={() => onRegister(purchase)} theme={theme} success /> : null}
        {pending ? <SmallAction danger isDarkMode={isDarkMode} label="Cancelar" onPress={() => onDelete(purchase)} theme={theme} /> : null}
      </View>
    </View>
  );
}

function SmallAction({ danger = false, isDarkMode, label, onPress, success = false, theme }) {
  const color = danger ? (isDarkMode ? '#fca5a5' : '#dc2626') : success ? '#16a34a' : theme.amber;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallAction,
        {
          backgroundColor: danger
            ? isDarkMode
              ? 'rgba(248, 113, 113, 0.12)'
              : '#fee2e2'
            : success
              ? isDarkMode
                ? 'rgba(34, 197, 94, 0.13)'
                : '#dcfce7'
              : isDarkMode
                ? 'rgba(245, 158, 11, 0.13)'
                : '#f3eee9',
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text style={[styles.smallActionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function ConfirmPurchaseModal({ draft, isDarkMode, isOpen, onCancel, onConfirm, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={isOpen}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, getModalSurface(isDarkMode, theme)]}>
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            Confirmar compra
          </Text>
          <Text selectable style={[styles.sheetSubtitle, { color: theme.muted }]}>
            Revisa que el insumo, cantidad y costo sean correctos.
          </Text>
          <PurchasePreview draft={draft} theme={theme} />
          <View style={styles.modalActions}>
            <ModalButton isDarkMode={isDarkMode} label="Cancelar" onPress={onCancel} theme={theme} />
            <ModalButton label="Confirmar" onPress={onConfirm} primary theme={theme} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PurchaseEditSheet({ draft, isDarkMode, isOpen, onCancel, onChange, onSave, theme }) {
  const canSave = Boolean(draft.name.trim()) && Number(draft.amount) > 0 && Number(draft.quantity) > 0;

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={isOpen}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetCard, getModalSurface(isDarkMode, theme)]}>
          <View style={[styles.sheetGrabber, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.18)' : '#d6d3d1' }]} />
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            Editar compra
          </Text>
          <Text selectable style={[styles.sheetSubtitle, { color: theme.muted }]}>
            Actualiza la compra pendiente antes de recibirla.
          </Text>

          <FormInput icon={draft.icon} isDarkMode={isDarkMode} label="Insumo" onChangeText={(name) => onChange({ name })} theme={theme} value={draft.name} />
          <View style={styles.inputRow}>
            <FormInput
              icon="🔢"
              isDarkMode={isDarkMode}
              keyboardType="numeric"
              label="Cantidad"
              onChangeText={(quantity) => onChange({ quantity })}
              small
              theme={theme}
              value={draft.quantity}
            />
            <FormInput icon="⚖️" isDarkMode={isDarkMode} label="Unidad" onChangeText={(unit) => onChange({ unit })} small theme={theme} value={draft.unit} />
          </View>
          <FormInput
            icon="💵"
            isDarkMode={isDarkMode}
            keyboardType="numeric"
            label="Costo total"
            onChangeText={(amount) => onChange({ amount })}
            theme={theme}
            value={draft.amount}
          />
          <View style={styles.statusRow}>
            <StatusChip active={draft.type === 'paid'} isDarkMode={isDarkMode} label="Registrada" onPress={() => onChange({ status: 'Registrada', type: 'paid' })} theme={theme} />
            <StatusChip active={draft.type === 'pending'} isDarkMode={isDarkMode} label="Pendiente" onPress={() => onChange({ status: 'Pendiente', type: 'pending' })} theme={theme} />
            <StatusChip active={draft.urgent} isDarkMode={isDarkMode} label="Urgente" onPress={() => onChange({ urgent: !draft.urgent })} theme={theme} warning />
          </View>
          <View style={styles.modalActions}>
            <ModalButton isDarkMode={isDarkMode} label="Cancelar" onPress={onCancel} theme={theme} />
            <ModalButton disabled={!canSave} label="Guardar" onPress={onSave} primary theme={theme} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PurchaseDetailModal({ isDarkMode, isOpen, onClose, onDelete, onEdit, onRegister, purchase, theme }) {
  if (!purchase) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, getModalSurface(isDarkMode, theme)]}>
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            Detalle de compra
          </Text>
          <Text selectable style={[styles.sheetSubtitle, { color: theme.muted }]}>
            Información del suministro y su impacto en inventario.
          </Text>
          <View style={[styles.detailBox, { backgroundColor: theme.actionSoft }]}>
            <CutRow label="Insumo" theme={theme} value={purchase.name} />
            <CutRow label="Cantidad" theme={theme} value={`${purchase.quantity} ${purchase.unit}`} />
            <CutRow label="Estado" theme={theme} value={purchase.status} />
            <CutRow final label="Costo" theme={theme} value={formatCurrency(purchase.amount)} />
          </View>
          <View style={styles.modalActions}>
            <ModalButton isDarkMode={isDarkMode} label="Cerrar" onPress={onClose} theme={theme} />
            {purchase.type === 'pending' ? <ModalButton label="Editar" onPress={() => onEdit(purchase)} primary theme={theme} /> : null}
          </View>
          <View style={styles.modalActions}>
            {purchase.type === 'pending' ? <ModalButton label="Recibir" onPress={() => onRegister(purchase)} success theme={theme} /> : null}
            {purchase.type === 'pending' ? <ModalButton danger label="Cancelar" onPress={() => onDelete(purchase)} theme={theme} /> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeletePurchaseModal({ isDarkMode, isOpen, onCancel, onConfirm, purchase, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={isOpen}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, getModalSurface(isDarkMode, theme)]}>
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            Cancelar compra
          </Text>
          <Text selectable style={[styles.sheetSubtitle, { color: theme.muted }]}>
            Solo las compras pendientes pueden cancelarse; no se modificará el inventario.
          </Text>
          {purchase ? <PurchasePreview draft={purchase} theme={theme} /> : null}
          <View style={styles.modalActions}>
            <ModalButton isDarkMode={isDarkMode} label="Conservar" onPress={onCancel} theme={theme} />
            <ModalButton danger label="Cancelar compra" onPress={onConfirm} theme={theme} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PurchasePreview({ draft, theme }) {
  return (
    <View style={[styles.previewBox, { backgroundColor: theme.actionSoft }]}>
      <View style={[styles.itemIcon, { backgroundColor: theme.softIcon }]}>
        <AppIcon color={theme.amber} name={draft.icon || 'cube'} size={22} />
      </View>
      <View style={styles.previewCopy}>
        <Text selectable style={[styles.purchaseName, { color: theme.title }]}>
          {draft.name || 'Insumo'}
        </Text>
        <Text selectable style={[styles.purchaseDetail, { color: theme.muted }]}>
          {draft.quantity || 0} {draft.unit || 'piezas'} · {draft.type === 'pending' ? 'Pendiente' : 'Registrada'}
        </Text>
      </View>
      <Text selectable style={[styles.purchaseAmount, { color: theme.amber }]}>
        {formatCurrency(draft.amount)}
      </Text>
    </View>
  );
}

function MovementCard({ movements, theme }) {
  return (
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

      {movements.slice(0, 5).map((movement, index) => (
        <View key={`${movement.text}-${index}`} style={styles.movementItem}>
          <AppIcon color={theme.amber} name={movement.icon} size={18} />
          <Text selectable style={[styles.movementCopy, { color: theme.muted }]}>
            {movement.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CutRow({ final = false, label, theme, value }) {
  return (
    <View style={[styles.cutRow, final && styles.cutFinalRow]}>
      <Text selectable style={[styles.cutLabel, { color: theme.muted }]}>
        {label}
      </Text>
      <Text selectable style={[styles.cutValue, { color: final ? theme.amber : theme.title }]}>
        {value}
      </Text>
    </View>
  );
}

function ModalButton({ danger = false, disabled = false, isDarkMode = false, label, onPress, primary = false, success = false, theme }) {
  const backgroundColor = danger
    ? '#dc2626'
    : success
      ? '#16a34a'
      : primary
        ? theme.accent
        : isDarkMode
          ? 'rgba(255,255,255,0.08)'
          : '#efe7e1';
  const color = primary || danger || success ? '#ffffff' : theme.title;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modalButton,
        {
          backgroundColor,
          opacity: disabled ? 0.45 : pressed ? 0.86 : 1,
        },
      ]}
    >
      <Text style={[styles.modalButtonText, { color }]}>{label}</Text>
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

function getPurchaseBadge(purchase, isDarkMode, theme) {
  if (purchase.type === 'paid') {
    return {
      bg: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
      border: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
      text: isDarkMode ? '#86efac' : '#166534',
    };
  }

  return {
    bg: theme.warningBg,
    border: isDarkMode ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
    text: theme.warningText,
  };
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 1120,
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
  formCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  supplyChip: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 13,
    height: 34,
    justifyContent: 'center',
    width: 40,
  },
  supplyChipIcon: {
    fontSize: 17,
  },
  inputBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 50,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inputSmall: {
    flex: 1,
    marginTop: 0,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  inputIcon: {
    fontSize: 14,
  },
  inputCopy: {
    flex: 1,
  },
  inputText: {
    fontSize: 10,
    fontWeight: '800',
  },
  input: {
    fontSize: 12,
    fontWeight: '900',
    minHeight: 22,
    outlineStyle: 'none',
    padding: 0,
    paddingTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statusChip: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 8,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '900',
  },
  registerButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    marginTop: 12,
  },
  registerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  formError: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    textAlign: 'center',
  },
  smallTitle: {
    marginTop: 14,
  },
  smallHeading: {
    fontSize: 18,
    fontWeight: '900',
  },
  purchaseList: {
    gap: 9,
    marginTop: 10,
  },
  purchaseCard: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  purchaseMain: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  purchaseLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingRight: 10,
  },
  itemIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  itemIconText: {
    fontSize: 21,
  },
  purchaseCopy: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 13,
    fontWeight: '900',
  },
  purchaseDetail: {
    fontSize: 10,
    paddingTop: 3,
  },
  purchaseRight: {
    alignItems: 'flex-end',
  },
  purchaseAmount: {
    fontSize: 13,
    fontWeight: '900',
  },
  purchaseBadge: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  purchaseBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  smallAction: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 11,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  smallActionText: {
    fontSize: 9,
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 26,
  },
  sheetOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 390,
    padding: 20,
    width: '100%',
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
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sheetSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 6,
  },
  previewBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    padding: 12,
  },
  previewCopy: {
    flex: 1,
  },
  detailBox: {
    borderCurve: 'continuous',
    borderRadius: 18,
    marginTop: 14,
    padding: 12,
  },
  cutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  cutFinalRow: {
    borderTopColor: 'rgba(120, 53, 15, 0.16)',
    borderTopWidth: 1,
    marginTop: 5,
    paddingTop: 10,
  },
  cutLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    paddingRight: 8,
  },
  cutValue: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  modalButtonText: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
});
