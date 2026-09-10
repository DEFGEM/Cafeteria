import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';

export default function EmptyState({ actionLabel, icon = '☕', onAction, subtitle, theme, title }) {
  return (
    <View
      style={[
        styles.emptyCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <View style={[styles.emptyIcon, { backgroundColor: theme.softIcon }]}>
        <AppIcon color={theme.amber} name={icon} size={30} />
      </View>
      <Text selectable style={[styles.emptyTitle, { color: theme.title }]}>
        {title}
      </Text>
      <Text selectable style={[styles.emptySubtitle, { color: theme.muted }]}>
        {subtitle}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={[styles.emptyButton, { backgroundColor: theme.accent }]}>
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
    padding: 18,
  },
  emptyIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emptyIconText: {
    fontSize: 25,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  emptyButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    marginTop: 6,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});
