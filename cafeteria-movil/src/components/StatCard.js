import { StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';

export default function StatCard({ icon, value, label, theme, compact = false }) {
  return (
    <View
      style={[
        styles.statBox,
        compact && styles.compactBox,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <AppIcon color={theme.amber} name={icon} size={compact ? 17 : 20} />
      <Text selectable style={[styles.statValue, compact && styles.compactValue, { color: theme.title }]}>
        {value}
      </Text>
      <Text selectable style={[styles.statLabel, { color: theme.muted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  compactBox: {
    paddingVertical: 12,
  },
  statIcon: {
    fontSize: 19,
  },
  compactIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    paddingTop: 6,
  },
  compactValue: {
    fontSize: 20,
    paddingTop: 5,
  },
  statLabel: {
    fontSize: 11,
    paddingTop: 2,
    textAlign: 'center',
  },
});
