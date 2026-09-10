import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';

export default function ModuleCard({ item, isDarkMode, theme, onPress }) {
  return (
    <View
      style={[
        styles.moduleCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <View style={[styles.moduleIconWrap, { backgroundColor: theme.softIcon }]}>
        <AppIcon color={theme.amber} name={item.icon} size={23} />
      </View>
      <Text selectable style={[styles.moduleTitle, { color: theme.title }]}>
        {item.title}
      </Text>
      <Text selectable style={[styles.moduleCopy, { color: theme.muted }]}>
        {item.description}
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.moduleButton,
          {
            backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
            boxShadow: isDarkMode ? '0 8px 18px rgba(217, 119, 6, 0.25)' : 'none',
            opacity: pressed ? 0.86 : 1,
          },
        ]}
      >
        <Text style={styles.moduleButtonText}>{item.buttonLabel || 'Entrar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  moduleCard: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    width: '47.8%',
  },
  moduleIconWrap: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  moduleIcon: {
    fontSize: 21,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '900',
    paddingTop: 10,
  },
  moduleCopy: {
    fontSize: 11,
    lineHeight: 14,
    minHeight: 31,
    paddingTop: 5,
  },
  moduleButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  moduleButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
