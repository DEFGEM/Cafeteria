import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useContext, useState } from 'react';

import SessionContext from '../context/SessionContext';
import AppIcon from './AppIcon';
import Modal from './AdaptiveModal';

const menuItems = [
  { icon: '🏠', label: 'Dashboard general', target: 'dashboard' },
  { icon: '🔔', label: 'Cliente / Mesero', target: 'customer' },
  { icon: '💵', label: 'Caja', target: 'cashier' },
  { icon: '👨‍🍳', label: 'Cocina', target: 'kitchen' },
  { icon: 'ðŸ‘¤', label: 'Perfil', target: 'profile' },
  { icon: 'âš™ï¸', label: 'Ajustes', target: 'settings' },
  { icon: 'â“', label: 'Ayuda', target: 'help' },
];

export default function MockStatusBar({ isDarkMode, menuMode = 'full', navigate, onBack, setIsDarkMode, showBack = false, theme }) {
  const { currentRole, userProfile } = useContext(SessionContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isThemeOnly = menuMode === 'themeOnly';
  const drawerMenuItems = menuItems.map((item) => {
    if (item.target === 'profile') {
      return { ...item, icon: '👤' };
    }

    if (item.target === 'settings') {
      return { ...item, icon: '⚙️' };
    }

    if (item.target === 'help') {
      return { ...item, icon: '❓' };
    }

    return item;
  });
  const fullDrawerMenuItems = [
    ...drawerMenuItems.slice(0, 4),
    { icon: '🔔', label: 'Notificaciones', target: 'notifications' },
    { icon: '📋', label: 'Actividad', target: 'activity' },
    ...drawerMenuItems.slice(4),
  ];
  const visibleDrawerMenuItems = currentRole?.drawerTargets
    ? fullDrawerMenuItems.filter((item) => currentRole.drawerTargets.includes(item.target))
    : fullDrawerMenuItems;

  const goTo = (target) => {
    setIsMenuOpen(false);
    if (navigate) {
      navigate(target);
    }
  };

  return (
    <View style={styles.statusBar}>
      <Pressable accessibilityLabel="Abrir menú" hitSlop={12} onPress={() => setIsMenuOpen(true)} style={styles.menuButton}>
        <View style={[styles.menuLine, { backgroundColor: theme.title }]} />
        <View style={[styles.menuLine, { backgroundColor: theme.title }]} />
        <View style={[styles.menuLine, { backgroundColor: theme.title }]} />
      </Pressable>

      {showBack && (
        <Pressable accessibilityLabel="Regresar" hitSlop={12} onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backArrow, { color: theme.title }]}>←</Text>
        </Pressable>
      )}

      <Modal animationType="slide" onRequestClose={() => setIsMenuOpen(false)} transparent visible={isMenuOpen}>
        <View style={styles.modalLayer}>
          <Pressable style={styles.scrim} onPress={() => setIsMenuOpen(false)} />
            <View
              style={[
                styles.drawer,
                isThemeOnly && styles.themeOnlyDrawer,
                {
                  backgroundColor: isDarkMode ? '#231811' : '#f8f8f8',
                  borderRightColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(120, 53, 15, 0.12)',
                },
              ]}
            >
            <ScrollView
              contentContainerStyle={styles.drawerScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.drawerScroll}
            >
            {!isThemeOnly && (
              <>
                <View style={styles.brandRow}>
                  <View
                    style={[
                      styles.brandIcon,
                      {
                        backgroundColor: isDarkMode ? '#d97706' : theme.accentAlt,
                        boxShadow: isDarkMode ? '0 12px 26px rgba(217,119,6,0.25)' : '0 12px 24px rgba(120,53,15,0.22)',
                      },
                    ]}
                  >
                    <AppIcon color="#ffffff" name="cafe" size={23} />
                  </View>
                  <View style={styles.brandCopy}>
                    <Text selectable style={[styles.brandTitle, { color: theme.title }]}>
                      CoffeeAdmin
                    </Text>
                    <Text selectable style={[styles.brandSubtitle, { color: theme.muted }]}>
                      {userProfile?.name || 'Fer'} · {userProfile?.role || currentRole?.label || 'Administrador'}
                    </Text>
                  </View>
                </View>

                <View style={styles.menuList}>
                  {visibleDrawerMenuItems.map((item) => (
                    <Pressable key={item.label} onPress={() => goTo(item.target)} style={styles.drawerItem}>
                      <AppIcon color={theme.amber} name={item.icon} size={20} />
                      <Text selectable style={[styles.drawerLabel, { color: theme.title }]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <View
              style={[
                styles.themeCard,
                isThemeOnly && styles.themeOnlyCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f1e7dc',
                },
              ]}
            >
              <View style={styles.themeCopy}>
                <View style={styles.themeTitleRow}>
                  <AppIcon color={theme.amber} name={isDarkMode ? 'moon' : 'sunny'} size={17} />
                  <Text selectable style={[styles.themeTitle, { color: theme.title }]}>{isDarkMode ? 'Modo oscuro' : 'Modo claro'}</Text>
                </View>
                <Text selectable style={[styles.themeSubtitle, { color: theme.muted }]}>
                  Cambiar apariencia de toda la app
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                thumbColor={isDarkMode ? '#00a8a8' : '#ffffff'}
                trackColor={{ false: '#ded5ca', true: '#f59e0b' }}
                ios_backgroundColor="#ded5ca"
              />
            </View>

            {!isThemeOnly && (
              <Pressable onPress={() => goTo('login')} style={styles.logoutRow}>
                <Text selectable style={[styles.logoutText, { color: theme.title }]}>
                  Cerrar sesión
                </Text>
                <Text style={[styles.logoutArrow, { color: theme.title }]}>→</Text>
              </Pressable>
            )}

            <Pressable onPress={() => setIsMenuOpen(false)} style={styles.closeRow}>
              <Text style={[styles.closeIcon, { color: theme.muted }]}>×</Text>
              <Text selectable style={[styles.closeText, { color: theme.muted }]}>
                Cerrar menú
              </Text>
            </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 30,
  },
  menuButton: {
    gap: 5,
    justifyContent: 'center',
    minHeight: 30,
    width: 36,
  },
  menuLine: {
    borderRadius: 4,
    height: 4,
    width: 28,
  },
  backButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 36,
  },
  backArrow: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 32,
  },
  modalLayer: {
    flex: 1,
    flexDirection: 'row',
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  drawer: {
    borderRightWidth: 1,
    height: '100%',
    maxWidth: 440,
    paddingHorizontal: 34,
    paddingTop: 78,
    width: '84%',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingBottom: 52,
  },
  themeOnlyDrawer: {
    paddingTop: 96,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
  },
  brandIcon: {
    alignItems: 'center',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  brandEmoji: {
    color: '#ffffff',
    fontSize: 25,
  },
  brandCopy: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  brandSubtitle: {
    fontSize: 17,
    paddingTop: 2,
  },
  menuList: {
    marginTop: 36,
  },
  drawerItem: {
    alignItems: 'center',
    borderBottomColor: 'rgba(120, 53, 15, 0.14)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 16,
    minHeight: 68,
  },
  drawerIcon: {
    fontSize: 22,
    width: 26,
  },
  drawerLabel: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
  },
  themeCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  themeOnlyCard: {
    marginTop: 0,
  },
  themeCopy: {
    flex: 1,
    paddingRight: 12,
  },
  themeTitle: {
    fontSize: 19,
    fontWeight: '900',
  },
  themeTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  themeSubtitle: {
    fontSize: 14,
    paddingTop: 6,
  },
  logoutRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(120, 53, 15, 0.14)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 30,
    minHeight: 62,
  },
  logoutText: {
    fontSize: 21,
    fontWeight: '900',
  },
  logoutArrow: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
  },
  closeIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  closeText: {
    fontSize: 20,
  },
});
