import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useState } from 'react';

import MockStatusBar from '../components/MockStatusBar';
import AppIcon from '../components/AppIcon';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';

const defaultSettings = {
  autoSync: true,
  cashierConfirmations: true,
  compactCards: false,
  kitchenDelayAlerts: true,
  lowStockAlerts: true,
  orderNotifications: true,
};

export default function SettingsScreen({
  appSettings = defaultSettings,
  goBack,
  isDarkMode,
  isSyncing = false,
  navigate,
  refreshData,
  setIsDarkMode,
  theme,
  updateAppSetting,
}) {
  const [modal, setModal] = useState(null);
  const activeAlerts = [
    appSettings.orderNotifications,
    appSettings.lowStockAlerts,
    appSettings.kitchenDelayAlerts,
    appSettings.cashierConfirmations,
  ].filter(Boolean).length;

  const resetSettings = () => {
    Object.entries(defaultSettings).forEach(([key, value]) => updateAppSetting(key, value));
    setModal('resetDone');
  };

  const runManualSync = async () => {
    await refreshData?.();
    setModal('syncDone');
  };

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <View style={styles.header}>
          <View>
            <Text selectable style={[styles.eyebrow, { color: theme.amber }]}>
              Cuenta
            </Text>
            <Text selectable style={[styles.title, { color: theme.title }]}>
              Ajustes
            </Text>
            <Text selectable style={[styles.subtitle, { color: theme.muted }]}>
              Apariencia, alertas y comportamiento
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? theme.accent : theme.accentAlt, boxShadow: theme.logoShadow }]}>
            <AppIcon color={theme.amber} name="settings" size={24} />
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? theme.accent : theme.accentAlt, boxShadow: theme.strongShadow }]}>
          <View>
            <Text selectable style={styles.summaryLabel}>
              Preferencias activas
            </Text>
            <Text selectable style={styles.summaryValue}>
              {activeAlerts} alertas
            </Text>
            <Text selectable style={styles.summaryHint}>
              Controla como responde la app
            </Text>
          </View>
          <View style={styles.summaryIcon}>
            <AppIcon color={theme.amber} name="notifications" size={21} />
          </View>
        </View>

        <SectionTitle title="Apariencia" subtitle="Personaliza como se ve CoffeeAdmin" compact theme={theme} />

        <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, boxShadow: theme.cardShadow }]}>
          <SettingSwitch
            description="Cambia los colores de toda la app."
            icon={isDarkMode ? '🌙' : '☀️'}
            isDarkMode={isDarkMode}
            label={isDarkMode ? 'Modo oscuro' : 'Modo claro'}
            onValueChange={setIsDarkMode}
            theme={theme}
            value={isDarkMode}
          />
          <SettingSwitch
            description="Reduce separaciones en paneles largos."
            icon="📐"
            isDarkMode={isDarkMode}
            label="Tarjetas compactas"
            onValueChange={(value) => updateAppSetting('compactCards', value)}
            theme={theme}
            value={appSettings.compactCards}
          />
        </View>

        <SectionTitle title="Alertas" subtitle="Notificaciones utiles para operar" compact theme={theme} />

        <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, boxShadow: theme.cardShadow }]}>
          <SettingSwitch
            description="Avisa cuando entra un pedido nuevo."
            icon="🧾"
            isDarkMode={isDarkMode}
            label="Pedidos nuevos"
            onValueChange={(value) => updateAppSetting('orderNotifications', value)}
            theme={theme}
            value={appSettings.orderNotifications}
          />
          <SettingSwitch
            description="Muestra avisos cuando cocina reporta atraso."
            icon="🔥"
            isDarkMode={isDarkMode}
            label="Demoras de cocina"
            onValueChange={(value) => updateAppSetting('kitchenDelayAlerts', value)}
            theme={theme}
            value={appSettings.kitchenDelayAlerts}
          />
          <SettingSwitch
            description="Resalta insumos por debajo del minimo."
            icon="📦"
            isDarkMode={isDarkMode}
            label="Stock bajo"
            onValueChange={(value) => updateAppSetting('lowStockAlerts', value)}
            theme={theme}
            value={appSettings.lowStockAlerts}
          />
          <SettingSwitch
            description="Pide confirmacion antes de registrar cobros."
            icon="💵"
            isDarkMode={isDarkMode}
            label="Confirmaciones de caja"
            onValueChange={(value) => updateAppSetting('cashierConfirmations', value)}
            theme={theme}
            value={appSettings.cashierConfirmations}
          />
        </View>

        <SectionTitle title="Datos y sincronizacion" subtitle="Acciones administrativas" compact theme={theme} />

        <View style={styles.actionList}>
          <ActionCard
            detail={appSettings.autoSync ? 'Sincronizacion automatica encendida' : 'Sincronizacion manual'}
            icon="🔄"
            onPress={() => updateAppSetting('autoSync', !appSettings.autoSync)}
            theme={theme}
            title="Sincronizacion"
            value={appSettings.autoSync ? 'Activa' : 'Manual'}
          />
          <ActionCard
            detail="Consulta ahora pedidos, inventario y avisos de la API."
            icon="↻"
            onPress={runManualSync}
            theme={theme}
            title="Sincronizar ahora"
            value={isSyncing ? 'Cargando' : 'Actualizar'}
          />
          <ActionCard
            detail="Vuelve a la configuracion recomendada."
            icon="↺"
            onPress={() => setModal('resetConfirm')}
            theme={theme}
            title="Restaurar ajustes"
            value="Reset"
          />
        </View>

        <View style={[styles.securityCard, { backgroundColor: theme.surfaceAlt, borderColor: isDarkMode ? theme.surfaceBorder : 'transparent' }]}>
          <Text selectable style={[styles.securityTitle, { color: theme.title }]}>
            Seguridad
          </Text>
          <Text selectable style={[styles.securityCopy, { color: theme.muted }]}>
            El acceso se mantiene por rol. Para cambios de permisos, usa Perfil o contacta al administrador desde Ayuda.
          </Text>
          <Pressable onPress={() => navigate('help')} style={[styles.helpButton, { backgroundColor: theme.accent }]}>
            <Text selectable style={styles.helpButtonText}>
              Abrir ayuda
            </Text>
          </Pressable>
        </View>
      </View>


      <InfoModal
        isDarkMode={isDarkMode}
        onClose={() => setModal(null)}
        theme={theme}
        title="Sincronización completa"
        visible={modal === 'syncDone'}
        description="Los datos se actualizaron desde la API."
      />
      <ConfirmModal
        description="Esto regresara las preferencias de alertas y sincronizacion a su estado recomendado."
        isDarkMode={isDarkMode}
        onCancel={() => setModal(null)}
        onConfirm={resetSettings}
        theme={theme}
        title="Restaurar ajustes"
        visible={modal === 'resetConfirm'}
      />
      <InfoModal
        isDarkMode={isDarkMode}
        onClose={() => setModal(null)}
        theme={theme}
        title="Ajustes restaurados"
        visible={modal === 'resetDone'}
        description="Las preferencias volvieron a la configuracion recomendada."
      />
    </ScreenBackground>
  );
}

function SettingSwitch({ description, icon, isDarkMode, label, onValueChange, theme, value }) {
  return (
    <View style={styles.switchRow}>
      <View style={[styles.switchIcon, { backgroundColor: theme.softIcon }]}>
        <AppIcon color={theme.amber} name={icon} size={20} />
      </View>
      <View style={styles.switchCopy}>
        <Text selectable style={[styles.switchTitle, { color: theme.title }]}>
          {label}
        </Text>
        <Text selectable style={[styles.switchDescription, { color: theme.muted }]}>
          {description}
        </Text>
      </View>
      <Switch
        ios_backgroundColor={theme.switchTrack}
        onValueChange={onValueChange}
        thumbColor={value ? (isDarkMode ? '#00a8a8' : '#ffffff') : '#ffffff'}
        trackColor={{ false: theme.switchTrack, true: theme.accent }}
        value={value}
      />
    </View>
  );
}

function ActionCard({ detail, icon, onPress, theme, title, value }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: theme.softIcon }]}>
        <AppIcon color={theme.amber} name={icon} size={20} />
      </View>
      <View style={styles.actionCopy}>
        <Text selectable style={[styles.actionTitle, { color: theme.title }]}>
          {title}
        </Text>
        <Text selectable style={[styles.actionDetail, { color: theme.muted }]}>
          {detail}
        </Text>
      </View>
      <View style={[styles.actionBadge, { backgroundColor: theme.actionSoft }]}>
        <Text selectable style={[styles.actionBadgeText, { color: theme.amber }]}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

function InfoModal({ description, isDarkMode, onClose, theme, title, visible }) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.centerLayer}>
        <View style={[styles.modalBox, { backgroundColor: isDarkMode ? '#231811' : '#ffffff', borderColor: theme.surfaceBorder }]}>
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            {title}
          </Text>
          <Text selectable style={[styles.modalText, { color: theme.muted }]}>
            {description}
          </Text>
          <Pressable onPress={onClose} style={[styles.modalButton, { backgroundColor: theme.accent }]}>
            <Text selectable style={styles.modalButtonText}>
              Entendido
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmModal({ description, isDarkMode, onCancel, onConfirm, theme, title, visible }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.centerLayer}>
        <View style={[styles.modalBox, { backgroundColor: isDarkMode ? '#231811' : '#ffffff', borderColor: theme.surfaceBorder }]}>
          <Text selectable style={[styles.modalTitle, { color: theme.title }]}>
            {title}
          </Text>
          <Text selectable style={[styles.modalText, { color: theme.muted }]}>
            {description}
          </Text>
          <View style={styles.modalActions}>
            <Pressable onPress={onCancel} style={[styles.modalButton, { backgroundColor: theme.actionSoft }]}>
              <Text selectable style={[styles.modalButtonText, { color: theme.title }]}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.modalButton, { backgroundColor: theme.accent }]}>
              <Text selectable style={styles.modalButtonText}>
                Restaurar
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 28,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 35,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 13,
    paddingTop: 4,
  },
  headerIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  headerIconText: {
    fontSize: 28,
  },
  summaryCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    padding: 19,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    paddingTop: 6,
  },
  summaryHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    paddingTop: 5,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderCurve: 'continuous',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  summaryIconText: {
    fontSize: 26,
  },
  settingCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 70,
  },
  switchIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  switchIconText: {
    fontSize: 19,
  },
  switchCopy: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  switchDescription: {
    fontSize: 11,
    lineHeight: 15,
    paddingTop: 3,
  },
  actionList: {
    gap: 10,
    paddingTop: 12,
  },
  actionCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    padding: 13,
  },
  actionIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  actionIconText: {
    fontSize: 20,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  actionDetail: {
    fontSize: 11,
    lineHeight: 15,
    paddingTop: 3,
  },
  actionBadge: {
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  securityCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  securityCopy: {
    fontSize: 12,
    lineHeight: 17,
    paddingTop: 6,
  },
  helpButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 15,
    marginTop: 14,
    minHeight: 46,
    justifyContent: 'center',
  },
  helpButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  centerLayer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  modalBox: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  modalText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});
