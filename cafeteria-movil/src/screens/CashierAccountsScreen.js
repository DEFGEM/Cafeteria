import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useState } from 'react';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import CashierTabs from '../components/CashierTabs';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';

const expenseCategories = ['Insumos', 'Servicios', 'Limpieza', 'Mantenimiento', 'Otro'];

export default function CashierAccountsScreen({
  addCashierExpense,
  cashierExpenses = [],
  cashierPurchases = [],
  customerOrders = [],
  currentRoleId,
  deleteCashierExpense,
  goBack,
  isDarkMode,
  setIsDarkMode,
  theme,
  navigate,
  updateCashierExpense,
}) {
  const expenses = cashierExpenses.filter((expense) => isToday(expense.createdAt));
  const receivedPurchases = cashierPurchases.filter(
    (purchase) => purchase.type === 'paid' && isToday(purchase.createdAt),
  );
  const canDeleteExpenses = currentRoleId === 'admin';
  const [movements, setMovements] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalMode, setExpenseModalMode] = useState('create');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
  const [isCutModalOpen, setIsCutModalOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState({
    amount: '',
    category: 'Insumos',
    description: '',
  });

  const paidOrders = customerOrders.filter(
    (order) => order.cashierStatus === 'paid' && isToday(order.paidAt || order.createdAt),
  );
  const liveSales = paidOrders.reduce((total, order) => total + getNumericTotal(order), 0);
  const salesTotal = liveSales;
  const expenseTotal = expenses.reduce((total, expense) => total + expense.amount, 0);
  const purchaseTotal = receivedPurchases.reduce((total, purchase) => total + purchase.amount, 0);
  const totalCosts = expenseTotal + purchaseTotal;
  const profitTotal = salesTotal - totalCosts;
  const paidByMethod = getPaidByMethod(paidOrders);
  const includedCosts = [
    ...expenses,
    ...receivedPurchases.map((purchase) => ({
      amount: purchase.amount,
      description: `Compra: ${purchase.name}`,
      id: `purchase-${purchase.id}`,
    })),
  ];
  const accountRows = [
    { badge: 'Ingreso', label: 'Ventas cobradas hoy', type: 'income', value: formatCurrency(salesTotal) },
    { badge: 'Gasto', label: 'Gastos operativos de hoy', type: 'expense', value: formatCurrency(expenseTotal) },
    { badge: 'Compra', label: 'Compras recibidas hoy', type: 'expense', value: formatCurrency(purchaseTotal) },
    { badge: 'Resultado', final: true, label: 'Resultado estimado', type: 'profit', value: formatCurrency(profitTotal) },
  ];
  const stats = [
    { icon: '💵', value: formatCompactCurrency(salesTotal), label: 'Ventas' },
    { icon: '🧾', value: formatCompactCurrency(totalCosts), label: 'Costos' },
    { icon: '✅', value: formatCompactCurrency(profitTotal), label: 'Resultado' },
  ];

  const openCreateExpense = () => {
    setExpenseModalMode('create');
    setSelectedExpense(null);
    setExpenseDraft({ amount: '', category: 'Insumos', description: '' });
    setIsExpenseModalOpen(true);
  };

  const openEditExpense = (expense) => {
    setExpenseModalMode('edit');
    setSelectedExpense(expense);
    setExpenseDraft({
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description,
    });
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
    setExpenseModalMode('create');
  };

  const registerExpense = async () => {
    const amount = Number(expenseDraft.amount.replace(/[^0-9.]/g, ''));
    const description = expenseDraft.description.trim();

    if (!amount || amount <= 0 || !description) {
      return;
    }

    const newExpense = {
      amount,
      category: expenseDraft.category,
      description,
    };

    setIsMutating(true);
    try {
      const created = await addCashierExpense(newExpense);
      if (!created) return;
      setMovements((currentMovements) => [
        { icon: '🧾', text: `Gasto registrado: ${description} (${formatCurrency(amount)})` },
        ...currentMovements,
      ]);
      setExpenseDraft({ amount: '', category: 'Insumos', description: '' });
      closeExpenseModal();
    } finally {
      setIsMutating(false);
    }
  };

  const saveEditedExpense = async () => {
    const amount = Number(expenseDraft.amount.replace(/[^0-9.]/g, ''));
    const description = expenseDraft.description.trim();

    if (!selectedExpense || !amount || amount <= 0 || !description) {
      return;
    }

    setIsMutating(true);
    try {
      const updated = await updateCashierExpense(selectedExpense.id, (expense) => ({
        ...expense,
        amount,
        category: expenseDraft.category,
        description,
      }));
      if (!updated) return;
      setMovements((currentMovements) => [
        { icon: '🧾', text: `Gasto editado: ${description} (${formatCurrency(amount)})` },
        ...currentMovements,
      ]);
      setExpenseDraft({ amount: '', category: 'Insumos', description: '' });
      closeExpenseModal();
    } finally {
      setIsMutating(false);
    }
  };

  const openDeleteExpense = (expense) => {
    if (!canDeleteExpenses) return;
    setSelectedExpense(expense);
    setIsDeleteExpenseModalOpen(true);
  };

  const cancelDeleteExpense = () => {
    setSelectedExpense(null);
    setIsDeleteExpenseModalOpen(false);
  };

  const deleteExpense = async () => {
    if (!selectedExpense) {
      return;
    }

    setIsMutating(true);
    try {
      const deleted = await deleteCashierExpense(selectedExpense.id);
      if (!deleted) return;
      setMovements((currentMovements) => [
        { icon: '🗑️', text: `Gasto eliminado: ${selectedExpense.description} (${formatCurrency(selectedExpense.amount)})` },
        ...currentMovements,
      ]);
      cancelDeleteExpense();
    } finally {
      setIsMutating(false);
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
          title="Cuentas"
          subtitle="Gastos, ganancias y corte"
          icon="💰"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <CashierTabs active="cashierAccounts" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title="Ganancia estimada"
          amount={formatCurrency(profitTotal)}
          subtitle="Ventas cobradas menos gastos y compras recibidas hoy"
          icon="📈"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        <SectionTitle title="Información de cuentas" subtitle="Resumen financiero del módulo de caja" compact theme={theme} />

        <View
          style={[
            styles.accountsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              boxShadow: theme.cardShadow,
            },
          ]}
        >
          {accountRows.map((row) => (
            <AccountRow key={row.label} isDarkMode={isDarkMode} row={row} theme={theme} />
          ))}
        </View>

        <View style={styles.actionsGrid}>
          <Pressable
            onPress={openCreateExpense}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                boxShadow: isDarkMode ? '0 8px 18px rgba(217, 119, 6, 0.25)' : 'none',
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <AppIcon color="#ffffff" name="add-circle" size={18} />
            <Text style={styles.actionText}>Registrar gasto</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsCutModalOpen(true)}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                boxShadow: isDarkMode ? '0 8px 18px rgba(217, 119, 6, 0.25)' : 'none',
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <AppIcon color="#ffffff" name="document-text" size={18} />
            <Text style={styles.actionText}>Ver corte</Text>
          </Pressable>
        </View>

        <ExpenseBreakdown
          canDelete={canDeleteExpenses}
          expenses={expenses}
          isDarkMode={isDarkMode}
          onDelete={openDeleteExpense}
          onEdit={openEditExpense}
          theme={theme}
        />

        <View
          style={[
            styles.cashCutCard,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(120, 53, 15, 0)',
            },
          ]}
        >
          <View style={styles.cashHeader}>
            <Text selectable style={[styles.cashHeading, { color: theme.title }]}>
              Resumen de caja
            </Text>
            <View
              style={[
                styles.openBadge,
                {
                  backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#ffffff',
                  borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                },
              ]}
            >
              <Text style={[styles.openBadgeText, { color: isDarkMode ? '#86efac' : '#15803d' }]}>
                Sincronizado
              </Text>
            </View>
          </View>

          <View style={styles.cashInfo}>
            <View style={styles.cashCopy}>
              <Text selectable style={[styles.cashTitle, { color: theme.title }]}>
                Vista financiera actual
              </Text>
              <Text selectable style={[styles.cashDetail, { color: theme.muted }]}>
                Calculada con los registros sincronizados de hoy
              </Text>
            </View>
            <Text selectable style={[styles.cashAmount, { color: isDarkMode ? theme.amber : theme.accent }]}>
              {formatCompactCurrency(profitTotal)}
            </Text>
          </View>
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
                  borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                },
              ]}
            >
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
          {!movements.length ? (
            <Text selectable style={[styles.movementCopy, { color: theme.muted, marginTop: 9 }]}>
              Sin cambios locales en esta sesión.
            </Text>
          ) : null}
        </View>
      </View>


      <ExpenseModal
        draft={expenseDraft}
        isDarkMode={isDarkMode}
        isOpen={isExpenseModalOpen}
        isSaving={isMutating}
        mode={expenseModalMode}
        onCancel={closeExpenseModal}
        onChange={setExpenseDraft}
        onSave={expenseModalMode === 'edit' ? saveEditedExpense : registerExpense}
        theme={theme}
      />
      <DeleteExpenseModal
        expense={selectedExpense}
        isDarkMode={isDarkMode}
        isOpen={isDeleteExpenseModalOpen}
        isSaving={isMutating}
        onCancel={cancelDeleteExpense}
        onConfirm={deleteExpense}
        theme={theme}
      />
      <CashCutModal
        costs={includedCosts}
        isDarkMode={isDarkMode}
        isOpen={isCutModalOpen}
        onClose={() => setIsCutModalOpen(false)}
        paidByMethod={paidByMethod}
        profitTotal={profitTotal}
        salesTotal={salesTotal}
        theme={theme}
        totalExpenses={totalCosts}
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

function getPaidByMethod(paidOrders) {
  return paidOrders.reduce(
    (totals, order) => ({
      ...totals,
      [order.paymentMethod || 'Efectivo']: (totals[order.paymentMethod || 'Efectivo'] || 0) + getNumericTotal(order),
    }),
    { Efectivo: 0, Tarjeta: 0, Transferencia: 0 },
  );
}

function isToday(value) {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  return parsed.getFullYear() === now.getFullYear()
    && parsed.getMonth() === now.getMonth()
    && parsed.getDate() === now.getDate();
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatCompactCurrency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString('en-US')}`;
}

function AccountRow({ isDarkMode, row, theme }) {
  const badgeColors = getBadgeColors(row.type, isDarkMode);

  return (
    <View
      style={[
        styles.accountRow,
        row.final && [
          styles.finalRow,
          {
            backgroundColor: theme.actionSoft,
            borderTopColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(120, 53, 15, 0.12)',
          },
        ],
      ]}
    >
      <View>
        <Text selectable style={[styles.accountLabel, { color: theme.muted }]}>
          {row.label}
        </Text>
        <Text selectable style={[styles.accountValue, { color: theme.title }]}>
          {row.value}
        </Text>
      </View>

      <View style={[styles.accountBadge, { backgroundColor: badgeColors.bg, borderColor: badgeColors.border }]}>
        <Text style={[styles.accountBadgeText, { color: badgeColors.text }]}>{row.badge}</Text>
      </View>
    </View>
  );
}

function ExpenseBreakdown({ canDelete, expenses, isDarkMode, onDelete, onEdit, theme }) {
  return (
    <View
      style={[
        styles.expenseCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <Text selectable style={[styles.expenseTitle, { color: theme.title }]}>
        Gastos de hoy
      </Text>
      {!expenses.length ? (
        <Text selectable style={[styles.expenseCategory, { color: theme.muted, marginTop: 10 }]}>
          No hay gastos operativos registrados hoy.
        </Text>
      ) : null}
      {expenses.slice(0, 4).map((expense, index) => (
        <View key={expense.id || `${expense.description}-${index}`} style={styles.expenseRow}>
          <View style={[styles.expenseIcon, { backgroundColor: theme.softIcon }]}>
            <AppIcon color={theme.amber} name="receipt" size={20} />
          </View>
          <View style={styles.expenseCopy}>
            <Text selectable style={[styles.expenseDescription, { color: theme.title }]}>
              {expense.description}
            </Text>
            <Text selectable style={[styles.expenseCategory, { color: theme.muted }]}>
              {expense.category}
            </Text>
          </View>
          <Text selectable style={[styles.expenseAmount, { color: isDarkMode ? '#fca5a5' : '#dc2626' }]}>
            -{formatCurrency(expense.amount)}
          </Text>
          <View style={styles.expenseActions}>
            <Pressable
              onPress={() => onEdit(expense)}
              style={({ pressed }) => [
                styles.expenseActionButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : '#f3eee9',
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Text style={[styles.expenseActionText, { color: theme.amber }]}>Editar</Text>
            </Pressable>
            {canDelete ? (
              <Pressable
                onPress={() => onDelete(expense)}
                style={({ pressed }) => [
                  styles.expenseActionButton,
                  {
                    backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.13)' : '#fee2e2',
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <Text style={[styles.expenseActionText, { color: isDarkMode ? '#fca5a5' : '#dc2626' }]}>Eliminar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function ExpenseModal({ draft, isDarkMode, isOpen, isSaving, mode = 'create', onCancel, onChange, onSave, theme }) {
  const canSave = Boolean(draft.description.trim()) && Number(draft.amount.replace(/[^0-9.]/g, '')) > 0;
  const isEditing = mode === 'edit';

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={isOpen}>
      <View style={styles.sheetOverlay}>
        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: isDarkMode ? '#231811' : '#ffffff',
              borderColor: theme.surfaceBorder,
              boxShadow: isDarkMode ? '0 18px 42px rgba(0,0,0,0.55)' : '0 18px 42px rgba(0,0,0,0.20)',
            },
          ]}
        >
          <View style={[styles.sheetGrabber, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.18)' : '#d6d3d1' }]} />
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            {isEditing ? 'Editar gasto' : 'Registrar gasto'}
          </Text>
          <Text selectable style={[styles.sheetSubtitle, { color: theme.muted }]}>
            {isEditing ? 'Corrige el gasto y actualiza el corte de caja.' : 'Agrega un egreso para recalcular ganancia y corte.'}
          </Text>

          <InputBox
            isDarkMode={isDarkMode}
            label="Descripción"
            onChangeText={(description) => onChange({ ...draft, description })}
            placeholder="Ej. Compra de servilletas"
            theme={theme}
            value={draft.description}
          />
          <InputBox
            isDarkMode={isDarkMode}
            keyboardType="numeric"
            label="Monto"
            onChangeText={(amount) => onChange({ ...draft, amount })}
            placeholder="0.00"
            theme={theme}
            value={draft.amount}
          />

          <Text selectable style={[styles.categoryLabel, { color: theme.title }]}>
            Categoría
          </Text>
          <View style={styles.categoryGrid}>
            {expenseCategories.map((category) => {
              const active = category === draft.category;

              return (
                <Pressable
                  key={category}
                  onPress={() => onChange({ ...draft, category })}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    {
                      backgroundColor: active
                        ? isDarkMode
                          ? theme.accent
                          : theme.accentAlt
                        : isDarkMode
                          ? 'rgba(255,255,255,0.08)'
                          : '#f3eee9',
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <Text selectable style={[styles.categoryChipText, { color: active ? '#ffffff' : theme.amber }]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
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
              disabled={!canSave || isSaving}
              onPress={onSave}
              style={({ pressed }) => [
                styles.modalPrimary,
                {
                  backgroundColor: theme.accent,
                  opacity: !canSave || isSaving ? 0.45 : pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.modalPrimaryText}>
                {isSaving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar gasto'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function InputBox({ isDarkMode, keyboardType = 'default', label, onChangeText, placeholder, theme, value }) {
  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.title }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f7eee5',
            borderColor: theme.surfaceBorder,
          },
        ]}
      >
        <TextInput
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

function DeleteExpenseModal({ expense, isDarkMode, isOpen, isSaving, onCancel, onConfirm, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={isOpen}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.deleteModalCard,
            {
              backgroundColor: isDarkMode ? '#231811' : '#ffffff',
              borderColor: theme.surfaceBorder,
              boxShadow: isDarkMode ? '0 18px 42px rgba(0,0,0,0.55)' : '0 18px 42px rgba(0,0,0,0.20)',
            },
          ]}
        >
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            Eliminar gasto
          </Text>
          <Text selectable style={[styles.sheetSubtitle, { color: theme.muted }]}>
            Esta accion quitara el gasto de cuentas y recalculara la ganancia.
          </Text>

          {expense ? (
            <View style={[styles.deletePreview, { backgroundColor: theme.actionSoft }]}>
              <View style={styles.deletePreviewCopy}>
                <Text selectable style={[styles.deletePreviewTitle, { color: theme.title }]}>
                  {expense.description}
                </Text>
                <Text selectable style={[styles.deletePreviewMeta, { color: theme.muted }]}>
                  {expense.category}
                </Text>
              </View>
              <Text selectable style={[styles.deletePreviewAmount, { color: isDarkMode ? '#fca5a5' : '#dc2626' }]}>
                -{formatCurrency(expense.amount)}
              </Text>
            </View>
          ) : null}

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
              <Text style={[styles.modalSecondaryText, { color: theme.title }]}>Conservar</Text>
            </Pressable>
            <Pressable
              disabled={isSaving}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalPrimary,
                {
                  backgroundColor: '#dc2626',
                  opacity: isSaving ? 0.55 : pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.modalPrimaryText}>{isSaving ? 'Eliminando…' : 'Eliminar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CashCutModal({
  costs,
  isDarkMode,
  isOpen,
  onClose,
  paidByMethod,
  profitTotal,
  salesTotal,
  theme,
  totalExpenses,
}) {
  const expensePreview = costs.slice(0, 5);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.cutModalCard,
            {
              backgroundColor: isDarkMode ? '#231811' : '#ffffff',
              borderColor: theme.surfaceBorder,
              boxShadow: isDarkMode ? '0 18px 42px rgba(0,0,0,0.55)' : '0 18px 42px rgba(0,0,0,0.20)',
            },
          ]}
        >
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            Corte de caja
          </Text>
          <Text selectable style={[styles.sheetSubtitle, { color: theme.muted }]}>
            Vista informativa calculada con los datos sincronizados de hoy.
          </Text>

          <View style={[styles.cutSummaryBox, { backgroundColor: theme.actionSoft }]}>
            <CutRow label="Ventas totales" strong theme={theme} value={formatCurrency(salesTotal)} />
            <CutRow label="Gastos" theme={theme} value={`-${formatCurrency(totalExpenses)}`} />
            <CutRow label="Total en caja" final theme={theme} value={formatCurrency(profitTotal)} />
          </View>

          <Text selectable style={[styles.cutSectionTitle, { color: theme.title }]}>
            Métodos de pago
          </Text>
          {Object.entries(paidByMethod).map(([method, amount]) => (
            <CutRow key={method} label={method} theme={theme} value={formatCurrency(amount)} />
          ))}

          <Text selectable style={[styles.cutSectionTitle, { color: theme.title }]}>
            Gastos incluidos
          </Text>
          {expensePreview.map((expense, index) => (
            <CutRow key={`${expense.description}-${index}`} label={expense.description} theme={theme} value={`-${formatCurrency(expense.amount)}`} />
          ))}

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.modalSecondary,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#efe7e1',
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={[styles.modalSecondaryText, { color: theme.title }]}>Cerrar vista</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CutRow({ final = false, label, strong = false, theme, value }) {
  return (
    <View style={[styles.cutRow, final && styles.cutFinalRow]}>
      <Text selectable style={[styles.cutLabel, { color: strong || final ? theme.title : theme.muted }]}>
        {label}
      </Text>
      <Text selectable style={[styles.cutValue, { color: final ? theme.amber : theme.title }]}>
        {value}
      </Text>
    </View>
  );
}

function getBadgeColors(type, isDarkMode) {
  if (type === 'income') {
    return {
      bg: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
      border: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
      text: isDarkMode ? '#86efac' : '#166534',
    };
  }

  if (type === 'profit') {
    return {
      bg: isDarkMode ? 'rgba(250, 204, 21, 0.18)' : '#fef3c7',
      border: isDarkMode ? 'rgba(250, 204, 21, 0.25)' : 'transparent',
      text: isDarkMode ? '#fde68a' : '#78350f',
    };
  }

  return {
    bg: isDarkMode ? 'rgba(248, 113, 113, 0.14)' : '#fee2e2',
    border: isDarkMode ? 'rgba(248, 113, 113, 0.24)' : 'transparent',
    text: isDarkMode ? '#fca5a5' : '#dc2626',
  };
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
  accountsCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  accountRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(120, 53, 15, 0.10)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  finalRow: {
    borderBottomWidth: 0,
    borderCurve: 'continuous',
    borderRadius: 16,
    borderTopWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  accountLabel: {
    fontSize: 11,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '900',
    paddingTop: 4,
  },
  accountBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  accountBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  actionButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  expenseCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  expenseRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 9,
    marginTop: 11,
  },
  expenseIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  expenseIconText: {
    fontSize: 15,
  },
  expenseCopy: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 12,
    fontWeight: '900',
  },
  expenseCategory: {
    fontSize: 10,
    paddingTop: 2,
  },
  expenseAmount: {
    fontSize: 12,
    fontWeight: '900',
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 43,
    marginTop: 8,
  },
  expenseActionButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 9,
  },
  expenseActionText: {
    fontSize: 9,
    fontWeight: '900',
  },
  cashCutCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  cashHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cashHeading: {
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
  cashInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  cashCopy: {
    flex: 1,
    paddingRight: 10,
  },
  cashTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  cashDetail: {
    fontSize: 11,
    paddingTop: 3,
  },
  cashAmount: {
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
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sheetSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 6,
  },
  inputGroup: {
    marginTop: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  inputWrap: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  input: {
    fontSize: 13,
    fontWeight: '700',
    minHeight: 24,
    outlineStyle: 'none',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 9,
  },
  categoryChip: {
    borderCurve: 'continuous',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '900',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 26,
  },
  cutModalCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 390,
    padding: 20,
    width: '100%',
  },
  deleteModalCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 360,
    padding: 20,
    width: '100%',
  },
  deletePreview: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 12,
  },
  deletePreviewCopy: {
    flex: 1,
  },
  deletePreviewTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  deletePreviewMeta: {
    fontSize: 11,
    paddingTop: 3,
  },
  deletePreviewAmount: {
    fontSize: 13,
    fontWeight: '900',
  },
  cutSummaryBox: {
    borderCurve: 'continuous',
    borderRadius: 18,
    marginTop: 14,
    padding: 12,
  },
  cutSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 14,
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
    minHeight: 42,
    justifyContent: 'center',
  },
  modalPrimary: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    minHeight: 42,
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
    textAlign: 'center',
  },
});
