import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScreenBackground({ children, gradientColors, isDarkMode, theme, contentStyle }) {
  const activeColors =
    gradientColors ||
    theme?.degradado ||
    (isDarkMode ? ['#1a130d', '#21170f', '#17110d'] : ['#f8e7b5', '#fff5d8', '#fffdf8']);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.screen, { backgroundColor: theme.background }, contentStyle]}
    >
      <LinearGradient
        colors={activeColors}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.48, 1]}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />

      {isDarkMode && (
        <>
          <View style={[styles.ambientGlow, styles.topGlow]} />
          <View style={[styles.ambientGlow, styles.bottomGlow]} />
        </>
      )}

      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    minHeight: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  ambientGlow: {
    borderRadius: 999,
    position: 'absolute',
  },
  topGlow: {
    backgroundColor: 'rgba(245, 158, 11, 0.24)',
    height: 220,
    right: -88,
    top: -76,
    width: 220,
  },
  bottomGlow: {
    backgroundColor: 'rgba(120, 53, 15, 0.45)',
    bottom: -104,
    height: 230,
    left: -92,
    width: 230,
  },
});
