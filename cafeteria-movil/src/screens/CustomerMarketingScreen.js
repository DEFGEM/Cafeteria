import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useState } from 'react';

import AppHeader from '../components/AppHeader';
import AppIcon from '../components/AppIcon';
import CustomerTabs from '../components/CustomerTabs';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import StatCard from '../components/StatCard';
import SummaryCard from '../components/SummaryCard';

const emptyPromotionDraft = {
  description: '',
  name: '',
  productId: '',
  type: 'Porcentaje',
  value: '',
};

const promotionTypes = ['Porcentaje', 'Monto', 'Precio fijo'];

export default function CustomerMarketingScreen({
  addPromotion,
  addMarketingItemToDraft,
  currentRoleId,
  deletePromotion,
  goBack,
  isDarkMode,
  promotions = [],
  recommendedProducts = [],
  setIsDarkMode,
  theme,
  updatePromotion,
  navigate,
}) {
  const canManage = currentRoleId === 'admin';
  const recommended = recommendedProducts.map((product) => ({
    detail: product.category || 'Producto disponible',
    icon: product.icon || '☕',
    orderItem: {
      icon: product.icon || '☕',
      menuId: product.id,
      name: product.name,
      price: Number(product.price || 0),
    },
    price: `$${Number(product.price || 0).toFixed(2)}`,
    title: product.name,
  }));
  const [suggestedPromos, setSuggestedPromos] = useState({});
  const [suggestedProducts, setSuggestedProducts] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [promotionDraft, setPromotionDraft] = useState(emptyPromotionDraft);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [isPromotionFormOpen, setIsPromotionFormOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const promoSuggestions = Object.values(suggestedPromos).reduce((total, count) => total + count, 0);
  const productSuggestions = Object.values(suggestedProducts).reduce((total, count) => total + count, 0);
  const suggestionTotal = promoSuggestions + productSuggestions;
  const marketingStats = [
    { icon: '📢', value: String(promotions.length), label: 'Promos' },
    { icon: '☕', value: String(recommended.length), label: 'Productos' },
    { icon: '⭐', value: String(suggestionTotal), label: 'En pedido' },
  ];

  const openCreatePromotion = () => {
    setEditingPromotion(null);
    setPromotionDraft({
      ...emptyPromotionDraft,
      productId: recommendedProducts[0]?.id ? String(recommendedProducts[0].id) : '',
    });
    setIsPromotionFormOpen(true);
  };

  const openEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setPromotionDraft({
      description: promotion.description || promotion.detail || '',
      name: promotion.title || '',
      productId: promotion.productId ? String(promotion.productId) : '',
      type: promotion.type || 'Porcentaje',
      value: String(promotion.numericValue || ''),
    });
    setIsPromotionFormOpen(true);
  };

  const closePromotionForm = () => {
    if (isMutating) return;
    setEditingPromotion(null);
    setPromotionDraft(emptyPromotionDraft);
    setIsPromotionFormOpen(false);
  };

  const savePromotion = async () => {
    const payload = {
      ...promotionDraft,
      name: promotionDraft.name.trim(),
      productId: Number(promotionDraft.productId),
      value: Number(promotionDraft.value),
    };
    if (!payload.name || !payload.productId || payload.value <= 0) return;

    setIsMutating(true);
    try {
      const saved = editingPromotion
        ? await updatePromotion(editingPromotion.id, payload)
        : await addPromotion(payload);
      if (!saved) return;
      setFeedback((items) => [
        { icon: editingPromotion ? '✏️' : '✅', text: `${payload.name} ${editingPromotion ? 'fue actualizada' : 'fue publicada'}.` },
        ...items,
      ]);
      setEditingPromotion(null);
      setPromotionDraft(emptyPromotionDraft);
      setIsPromotionFormOpen(false);
    } finally {
      setIsMutating(false);
    }
  };

  const confirmDeletePromotion = async () => {
    if (!promotionToDelete) return;
    setIsMutating(true);
    try {
      const deleted = await deletePromotion(promotionToDelete.id);
      if (!deleted) return;
      setFeedback((items) => [
        { icon: '⏸️', text: `${promotionToDelete.title} fue desactivada.` },
        ...items,
      ]);
      setPromotionToDelete(null);
    } finally {
      setIsMutating(false);
    }
  };

  const openPromotionSuggestion = (promotion) => {
    setSelectedSuggestion({
      ...promotion,
      confirmText: 'Confirmar sugerencia',
      kind: 'promotion',
      message: `¿Deseas sugerir "${promotion.title}" al cliente y agregarlo al pedido en curso?`,
    });
  };

  const openProductSuggestion = (product) => {
    setSelectedSuggestion({
      ...product,
      confirmText: 'Sugerir producto',
      kind: 'product',
      label: product.detail,
      message: `¿Deseas sugerir "${product.title}" al cliente y agregarlo al pedido en curso?`,
      value: product.price,
    });
  };

  const confirmSuggestion = () => {
    if (!selectedSuggestion) {
      return;
    }

    if (selectedSuggestion.kind === 'promotion') {
      addMarketingItemToDraft(selectedSuggestion.orderItem);
      setSuggestedPromos((currentSuggestions) => ({
        ...currentSuggestions,
        [selectedSuggestion.title]: (currentSuggestions[selectedSuggestion.title] || 0) + 1,
      }));
      setFeedback((currentFeedback) => [
        { icon: '✅', text: `${selectedSuggestion.title} fue sugerida al cliente.` },
        ...currentFeedback,
      ]);
    } else {
      addMarketingItemToDraft(selectedSuggestion.orderItem);
      setSuggestedProducts((currentSuggestions) => ({
        ...currentSuggestions,
        [selectedSuggestion.title]: (currentSuggestions[selectedSuggestion.title] || 0) + 1,
      }));
      setFeedback((currentFeedback) => [
        { icon: '☕', text: `${selectedSuggestion.title} agregado como recomendación al cliente.` },
        ...currentFeedback,
      ]);
    }

    setSelectedSuggestion(null);
    navigate('customerOrder');
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
          title="Marketing"
          subtitle="Promociones y sugerencias al cliente"
          icon="📢"
          isDarkMode={isDarkMode}
          theme={theme}
          titleSize={27}
        />

        <CustomerTabs active="customerMarketing" isDarkMode={isDarkMode} navigate={navigate} theme={theme} />

        <SummaryCard
          title={promotions.length ? 'Promoción activa' : 'Promociones'}
          amount={promotions[0]?.title || 'Sin promociones activas'}
          subtitle={promotions[0] ? `${promotions[0].detail} · ${promotions[0].value}` : 'El administrador puede publicar una nueva promoción'}
          icon="⭐"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={styles.statsRow}>
          {marketingStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact theme={theme} />
          ))}
        </View>

        {canManage ? (
          <Pressable
            disabled={!recommendedProducts.length}
            onPress={openCreatePromotion}
            style={({ pressed }) => [
              styles.manageButton,
              {
                backgroundColor: theme.accent,
                opacity: !recommendedProducts.length ? 0.45 : pressed ? 0.84 : 1,
              },
            ]}
          >
            <AppIcon color="#ffffff" name="add-circle" size={18} />
            <Text style={styles.manageButtonText}>Nueva promoción</Text>
          </Pressable>
        ) : null}

        <SectionTitle
          title="Promociones para sugerir"
          subtitle="Ofrece promociones al levantar pedidos"
          compact
          theme={theme}
        />

        <View style={styles.promoList}>
          {promotions.map((promotion) => (
            <PromoCard
              canManage={canManage}
              key={promotion.id || promotion.title}
              isDarkMode={isDarkMode}
              onDelete={() => setPromotionToDelete(promotion)}
              onEdit={() => openEditPromotion(promotion)}
              onSuggest={() => openPromotionSuggestion(promotion)}
              promotion={promotion}
              suggestedCount={suggestedPromos[promotion.title] || 0}
              theme={theme}
            />
          ))}
          {!promotions.length ? (
            <Text selectable style={[styles.emptyText, { color: theme.muted }]}>
              No hay promociones vigentes para productos.
            </Text>
          ) : null}
        </View>

        <SectionTitle title="Productos recomendados" compact theme={theme} />

        <View style={styles.recommendedGrid}>
          {recommended.map((item) => (
            <RecommendedCard
              key={item.title}
              isDarkMode={isDarkMode}
              item={item}
              onSuggest={() => openProductSuggestion(item)}
              suggestedCount={suggestedProducts[item.title] || 0}
              theme={theme}
            />
          ))}
          {!recommended.length ? (
            <Text selectable style={[styles.emptyText, { color: theme.muted }]}>
              No hay productos disponibles para recomendar.
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
            },
          ]}
        >
          <View style={styles.feedbackHeader}>
            <Text selectable style={[styles.feedbackTitle, { color: theme.title }]}>
              Acciones de esta sesión
            </Text>
            <View style={[styles.todayBadge, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.10)' : '#ffffff' }]}>
              <Text selectable style={[styles.todayText, { color: theme.amber }]}>
                Hoy
              </Text>
            </View>
          </View>

          {feedback.slice(0, 4).map((item, index) => (
            <View key={`${item.text}-${index}`} style={styles.feedbackItem}>
              <AppIcon color={theme.amber} name={item.icon} size={18} />
              <Text selectable style={[styles.feedbackText, { color: theme.muted }]}>
                {item.text}
              </Text>
            </View>
          ))}
          {!feedback.length ? (
            <Text selectable style={[styles.feedbackText, { color: theme.muted, paddingTop: 10 }]}>
              Aún no se han agregado sugerencias al pedido.
            </Text>
          ) : null}
        </View>
      </View>


      <SuggestionModal
        isDarkMode={isDarkMode}
        onCancel={() => setSelectedSuggestion(null)}
        onConfirm={confirmSuggestion}
        suggestion={selectedSuggestion}
        theme={theme}
      />
      <PromotionFormModal
        draft={promotionDraft}
        isDarkMode={isDarkMode}
        isEditing={Boolean(editingPromotion)}
        isOpen={isPromotionFormOpen}
        isSaving={isMutating}
        onCancel={closePromotionForm}
        onChange={(changes) => setPromotionDraft((current) => ({ ...current, ...changes }))}
        onSave={savePromotion}
        products={recommendedProducts}
        theme={theme}
      />
      <DeletePromotionModal
        isDarkMode={isDarkMode}
        isSaving={isMutating}
        onCancel={() => !isMutating && setPromotionToDelete(null)}
        onConfirm={confirmDeletePromotion}
        promotion={promotionToDelete}
        theme={theme}
      />
    </ScreenBackground>
  );
}

function PromoCard({ canManage, isDarkMode, onDelete, onEdit, onSuggest, promotion, suggestedCount, theme }) {
  const badgeColors =
    promotion.badgeType === 'active'
      ? {
          backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
          borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
          color: isDarkMode ? '#86efac' : '#166534',
        }
      : {
          backgroundColor: isDarkMode ? 'rgba(251, 146, 60, 0.15)' : '#ffedd5',
          borderColor: isDarkMode ? 'rgba(251, 146, 60, 0.25)' : 'transparent',
          color: isDarkMode ? '#fb923c' : '#c2410c',
        };

  return (
    <View
      style={[
        styles.promoCard,
        promotion.featured && !isDarkMode && styles.lightFeaturedPromo,
        {
          backgroundColor: promotion.featured && !isDarkMode ? '#fef3c7' : theme.surface,
          borderColor: promotion.featured && !isDarkMode ? 'rgba(120, 53, 15, 0.08)' : theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <View style={styles.promoTop}>
        <View style={styles.promoCopy}>
          <Text selectable style={[styles.promoTitle, { color: theme.title }]}>
            {promotion.title}
          </Text>
          <Text selectable style={[styles.promoDetail, { color: theme.muted }]}>
            {promotion.detail}
          </Text>
        </View>
        <View style={styles.badgeStack}>
          <View
            style={[
              styles.promoBadge,
              {
                backgroundColor: badgeColors.backgroundColor,
                borderColor: badgeColors.borderColor,
              },
            ]}
          >
            <Text selectable style={[styles.promoBadgeText, { color: badgeColors.color }]}>
              {promotion.badge}
            </Text>
          </View>
          {suggestedCount > 0 && (
            <View style={[styles.suggestedBadge, { backgroundColor: theme.actionSoft }]}>
              <Text selectable style={[styles.suggestedBadgeText, { color: theme.amber }]}>
                x{suggestedCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={[
          styles.promoPrice,
          {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(120, 53, 15, 0.08)',
          },
        ]}
      >
        <Text selectable style={[styles.promoPriceLabel, { color: theme.muted }]}>
          {promotion.label}
        </Text>
        <Text selectable style={[styles.promoPriceValue, { color: theme.amber }]}>
          {promotion.value}
        </Text>
      </View>

      <Pressable
        onPress={onSuggest}
        style={({ pressed }) => [
          styles.suggestButton,
          {
            backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
            opacity: pressed ? 0.82 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Text style={styles.suggestButtonText}>{suggestedCount > 0 ? 'Sugerir otra vez' : 'Sugerir al cliente'}</Text>
      </Pressable>
      {canManage ? (
        <View style={styles.manageActions}>
          <Pressable onPress={onEdit} style={[styles.manageAction, { backgroundColor: theme.actionSoft }]}>
            <Text style={[styles.manageActionText, { color: theme.amber }]}>Editar</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.manageAction, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.manageActionText, { color: '#dc2626' }]}>Desactivar</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function RecommendedCard({ isDarkMode, item, onSuggest, suggestedCount, theme }) {
  return (
    <Pressable
      onPress={onSuggest}
      style={({ pressed }) => [
        styles.recommendedCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.recommendedTop}>
        <View style={[styles.itemIcon, { backgroundColor: theme.softIcon }]}>
          <AppIcon color={theme.amber} name={item.icon} size={22} />
        </View>
        {suggestedCount > 0 && (
          <View style={[styles.smallCountBadge, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#fef3c7' }]}>
            <Text selectable style={[styles.smallCountText, { color: theme.amber }]}>
              x{suggestedCount}
            </Text>
          </View>
        )}
      </View>
      <Text selectable style={[styles.recommendedTitle, { color: theme.title }]}>
        {item.title}
      </Text>
      <Text selectable style={[styles.recommendedDetail, { color: theme.muted }]}>
        {item.detail}
      </Text>
      <View style={styles.recommendedBottom}>
        <Text selectable style={[styles.recommendedPrice, { color: theme.amber }]}>
          {item.price}
        </Text>
        <Text selectable style={[styles.recommendedAction, { color: theme.amber }]}>
          Sugerir
        </Text>
      </View>
    </Pressable>
  );
}

function PromotionFormModal({
  draft,
  isDarkMode,
  isEditing,
  isOpen,
  isSaving,
  onCancel,
  onChange,
  onSave,
  products,
  theme,
}) {
  const numericValue = Number(draft.value || 0);
  const canSave = Boolean(draft.name.trim())
    && Boolean(Number(draft.productId))
    && numericValue > 0
    && (draft.type !== 'Porcentaje' || numericValue <= 100);

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={isOpen}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.promotionForm, { backgroundColor: isDarkMode ? '#231811' : '#ffffff', borderColor: theme.surfaceBorder }]}>
          <View style={[styles.sheetGrabber, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.18)' : '#d6d3d1' }]} />
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            {isEditing ? 'Editar promoción' : 'Nueva promoción'}
          </Text>
          <Text selectable style={[styles.modalText, { color: theme.muted }]}>
            La promoción estará vigente 30 días y se aplicará al producto seleccionado.
          </Text>

          <TextInput
            onChangeText={(name) => onChange({ name })}
            placeholder="Nombre de la promoción"
            placeholderTextColor={theme.muted}
            style={[styles.formInput, { backgroundColor: theme.actionSoft, color: theme.title }]}
            value={draft.name}
          />
          <TextInput
            onChangeText={(description) => onChange({ description })}
            placeholder="Descripción"
            placeholderTextColor={theme.muted}
            style={[styles.formInput, { backgroundColor: theme.actionSoft, color: theme.title }]}
            value={draft.description}
          />
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(value) => onChange({ value })}
            placeholder={draft.type === 'Porcentaje' ? 'Descuento, por ejemplo 15' : 'Monto, por ejemplo 25'}
            placeholderTextColor={theme.muted}
            style={[styles.formInput, { backgroundColor: theme.actionSoft, color: theme.title }]}
            value={draft.value}
          />

          <Text selectable style={[styles.formLabel, { color: theme.title }]}>Tipo</Text>
          <View style={styles.formChips}>
            {promotionTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => onChange({ type })}
                style={[styles.formChip, { backgroundColor: draft.type === type ? theme.accent : theme.actionSoft }]}
              >
                <Text style={[styles.formChipText, { color: draft.type === type ? '#ffffff' : theme.amber }]}>{type}</Text>
              </Pressable>
            ))}
          </View>

          <Text selectable style={[styles.formLabel, { color: theme.title }]}>Producto</Text>
          <View style={styles.formChips}>
            {products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => onChange({ productId: String(product.id) })}
                style={[
                  styles.formChip,
                  { backgroundColor: String(draft.productId) === String(product.id) ? theme.accent : theme.actionSoft },
                ]}
              >
                <Text
                  style={[
                    styles.formChipText,
                    { color: String(draft.productId) === String(product.id) ? '#ffffff' : theme.amber },
                  ]}
                >
                  {product.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {draft.type === 'Porcentaje' && numericValue > 100 ? (
            <Text selectable style={styles.formError}>El porcentaje no puede superar 100.</Text>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable onPress={onCancel} style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.actionSoft }]}>
              <Text style={[styles.cancelButtonText, { color: theme.title }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              disabled={!canSave || isSaving}
              onPress={onSave}
              style={[styles.modalButton, { backgroundColor: theme.accent, opacity: !canSave || isSaving ? 0.45 : 1 }]}
            >
              <Text style={styles.confirmButtonText}>{isSaving ? 'Guardando…' : 'Guardar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeletePromotionModal({ isDarkMode, isSaving, onCancel, onConfirm, promotion, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(promotion)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: isDarkMode ? '#231811' : '#ffffff', borderColor: theme.surfaceBorder }]}>
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>Desactivar promoción</Text>
          <Text selectable style={[styles.modalText, { color: theme.muted }]}>
            {promotion ? `${promotion.title} dejará de aparecer y ya no podrá aplicarse a pedidos nuevos.` : ''}
          </Text>
          <View style={styles.modalActions}>
            <Pressable onPress={onCancel} style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.actionSoft }]}>
              <Text style={[styles.cancelButtonText, { color: theme.title }]}>Conservar</Text>
            </Pressable>
            <Pressable
              disabled={isSaving}
              onPress={onConfirm}
              style={[styles.modalButton, { backgroundColor: '#dc2626', opacity: isSaving ? 0.55 : 1 }]}
            >
              <Text style={styles.confirmButtonText}>{isSaving ? 'Desactivando…' : 'Desactivar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SuggestionModal({ isDarkMode, onCancel, onConfirm, suggestion, theme }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(suggestion)}>
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
            Confirmar sugerencia
          </Text>
          <Text selectable style={[styles.modalText, { color: theme.muted }]}>
            {suggestion?.message}
          </Text>
          <View
            style={[
              styles.modalSummary,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(120, 53, 15, 0.08)',
              },
            ]}
          >
            <Text selectable style={[styles.modalSummaryTitle, { color: theme.title }]}>
              {suggestion?.title}
            </Text>
            <Text selectable style={[styles.modalSummaryText, { color: theme.muted }]}>
              {suggestion?.detail || suggestion?.label}
            </Text>
            <Text selectable style={[styles.modalSummaryValue, { color: theme.amber }]}>
              {suggestion?.value}
            </Text>
          </View>
          <View style={styles.modalActions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.modalButton,
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f3eee9',
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Text selectable style={[styles.cancelButtonText, { color: theme.title }]}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalButton,
                {
                  backgroundColor: theme.accent,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Text selectable style={styles.confirmButtonText}>
                {suggestion?.confirmText || 'Confirmar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  manageButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 44,
  },
  manageButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  promoList: {
    gap: 10,
    paddingTop: 10,
  },
  promoCard: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
  },
  lightFeaturedPromo: {
    borderWidth: 1,
  },
  promoTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  promoCopy: {
    flex: 1,
    paddingRight: 4,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  promoDetail: {
    fontSize: 10,
    lineHeight: 14,
    paddingTop: 4,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 5,
  },
  promoBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  promoBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  suggestedBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suggestedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  promoPrice: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  promoPriceLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  promoPriceValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  suggestButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 13,
    height: 38,
    justifyContent: 'center',
    marginTop: 11,
  },
  suggestButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  manageActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  manageAction: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 11,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
  },
  manageActionText: {
    fontSize: 10,
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 10,
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 10,
  },
  recommendedCard: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 142,
    padding: 13,
    width: '47.7%',
  },
  recommendedTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  smallCountBadge: {
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallCountText: {
    fontSize: 9,
    fontWeight: '900',
  },
  recommendedTitle: {
    fontSize: 13,
    fontWeight: '900',
    paddingTop: 10,
  },
  recommendedDetail: {
    fontSize: 11,
    minHeight: 30,
    paddingTop: 4,
  },
  recommendedBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  recommendedPrice: {
    fontSize: 14,
    fontWeight: '900',
  },
  recommendedAction: {
    fontSize: 10,
    fontWeight: '900',
  },
  feedbackCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  feedbackHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedbackTitle: {
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
  feedbackItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 9,
  },
  feedbackIcon: {
    fontSize: 14,
  },
  feedbackText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheetOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  promotionForm: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '92%',
    padding: 22,
  },
  sheetGrabber: {
    alignSelf: 'center',
    borderRadius: 10,
    height: 5,
    marginBottom: 16,
    width: 46,
  },
  formInput: {
    borderCurve: 'continuous',
    borderRadius: 14,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    minHeight: 44,
    outlineStyle: 'none',
    paddingHorizontal: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 14,
  },
  formChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 8,
  },
  formChip: {
    borderCurve: 'continuous',
    borderRadius: 12,
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  formChipText: {
    fontSize: 10,
    fontWeight: '900',
  },
  formError: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
  },
  modalCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 360,
    padding: 18,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalText: {
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 8,
  },
  modalSummary: {
    borderCurve: 'continuous',
    borderRadius: 18,
    marginTop: 14,
    padding: 14,
  },
  modalSummaryTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  modalSummaryText: {
    fontSize: 12,
    paddingTop: 4,
  },
  modalSummaryValue: {
    fontSize: 17,
    fontWeight: '900',
    paddingTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  cancelButton: {
    borderWidth: 0,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
});
