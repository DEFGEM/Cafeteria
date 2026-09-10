import { StyleSheet, Text, View } from 'react-native';

export default function SectionTitle({ title, subtitle, theme, compact = false }) {
  return (
    <View style={[styles.sectionTitle, compact && styles.compact]}>
      <Text selectable style={[styles.sectionHeading, compact && styles.compactHeading, { color: theme.title }]}>
        {title}
      </Text>
      <Text selectable style={[styles.sectionSubtitle, { color: theme.muted }]}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    paddingTop: 24,
  },
  compact: {
    paddingTop: 20,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '900',
  },
  compactHeading: {
    fontSize: 19,
  },
  sectionSubtitle: {
    fontSize: 12,
    paddingTop: 4,
  },
});
