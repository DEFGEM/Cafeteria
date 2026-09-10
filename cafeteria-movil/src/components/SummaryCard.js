import { StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';

export default function SummaryCard({ icon, title, amount, subtitle, isDarkMode, theme }) {
  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
          boxShadow: theme.strongShadow,
        },
      ]}
    >
      <View>
        <Text selectable style={styles.summaryTitle}>
          {title}
        </Text>
        <Text selectable style={styles.summaryAmount}>
          {amount}
        </Text>
        <Text selectable style={styles.summarySubtitle}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.summaryIcon}>
        <AppIcon color={theme.amber} name={icon} size={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    padding: 20,
  },
  summaryTitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
  },
  summaryAmount: {
    color: '#ffffff',
    fontSize: 28,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    paddingTop: 6,
  },
  summarySubtitle: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 12,
    paddingTop: 6,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderCurve: 'continuous',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  summaryIconText: {
    fontSize: 27,
  },
});
