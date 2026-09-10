import { StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';

export default function AppHeader({ eyebrow, title, subtitle, icon, isDarkMode, theme, titleSize }) {
  return (
    <View style={styles.header}>
      <View>
        <Text selectable style={[styles.eyebrow, { color: theme.amber }]}>
          {eyebrow}
        </Text>
        <Text selectable style={[styles.title, titleSize && { fontSize: titleSize, lineHeight: titleSize + 4 }, { color: theme.title }]}>
          {title}
        </Text>
        <Text selectable style={[styles.subtitle, { color: theme.muted }]}>
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.profileCircle,
          {
            backgroundColor: isDarkMode ? '#92400e' : theme.accent,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0)',
            boxShadow: theme.logoShadow,
          },
        ]}
      >
        <AppIcon color="#ffffff" name={icon} size={25} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 28,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 13,
    paddingTop: 4,
  },
  profileCircle: {
    alignItems: 'center',
    borderRadius: 29,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  profileIcon: {
    fontSize: 29,
  },
});
