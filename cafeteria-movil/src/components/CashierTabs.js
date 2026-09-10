import { Pressable, StyleSheet, Text, View } from 'react-native';

const tabs = [
  { label: 'Pedidos', target: 'cashierOrders' },
  { label: 'Cuentas', target: 'cashierAccounts' },
  { label: 'Compras', target: 'cashierPurchases' },
];

export default function CashierTabs({ active, isDarkMode, navigate, theme }) {
  return (
    <View
      style={[
        styles.tabs,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.target === active;

        return (
          <Pressable
            key={tab.label}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (tab.target === 'cashierAccounts' || tab.target === 'cashierOrders' || tab.target === 'cashierPurchases') {
                navigate(tab.target);
              }
            }}
            style={[
              styles.tab,
              isActive && {
                backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
              },
            ]}
          >
            <Text selectable style={[styles.tabText, { color: isActive ? '#ffffff' : theme.muted }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 22,
    padding: 6,
  },
  tab: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
