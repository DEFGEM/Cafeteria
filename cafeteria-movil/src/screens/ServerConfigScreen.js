import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';

import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import AppIcon from '../components/AppIcon';
import { getApiUrl, probarConexion, resetApiUrl, saveApiUrl } from '../config/environment';

export default function ServerConfigScreen({
  goBack,
  isDarkMode,
  navigate,
  setIsDarkMode,
  theme,
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const current = await getApiUrl();
        if (active) {
          setUrl(String(current || '').replace(/^https?:\/\//, ''));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    init();
    return () => {
      active = false;
    };
  }, []);

  const validateUrl = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return false;
    return /^(https?:\/\/)?([\w.-]+|\[[0-9a-f:]+\])(:\d{1,5})?$/.test(trimmed);
  };

  const handleSave = async () => {
    try {
      setError('');
      setMessage('');
      if (!validateUrl(url)) {
        setError('Ingresa una IP o dominio válido, por ejemplo: 192.168.0.17:8000');
        return;
      }
      const saved = await saveApiUrl(url);
      setMessage(`Guardado: ${saved}`);
    } catch (e) {
      setError('No se pudo guardar la configuración.');
    }
  };

  const handleTest = async () => {
    try {
      setError('');
      setMessage('');
      if (!validateUrl(url)) {
        setError('Ingresa una IP o dominio válido antes de probar.');
        return;
      }
      setTesting(true);
      const saved = await saveApiUrl(url);
      const ok = await probarConexion(saved);
      setTesting(false);
      setMessage(
        ok
          ? `Conectado correctamente a ${saved}`
          : `No se pudo conectar a ${saved}. Verifica que la API esté corriendo.`,
      );
    } catch (e) {
      setTesting(false);
      setError(`Error de conexión: ${e?.message || e}`);
    }
  };

  const handleReset = async () => {
    try {
      setError('');
      setMessage('');
      const restored = await resetApiUrl();
      setUrl(String(restored || '').replace(/^https?:\/\//, ''));
      setMessage('URL restablecida a la configuración por defecto.');
    } catch (e) {
      setError('No se pudo restablecer la configuración.');
    }
  };

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar
          isDarkMode={isDarkMode}
          menuMode="themeOnly"
          navigate={navigate}
          onBack={goBack}
          setIsDarkMode={setIsDarkMode}
          showBack
          theme={theme}
        />

        <View style={styles.header}>
          <View>
            <Text selectable style={[styles.eyebrow, { color: theme.amber }]}>
              Servidor
            </Text>
            <Text selectable style={[styles.title, { color: theme.title }]}>
              Configuración de la API
            </Text>
            <Text selectable style={[styles.subtitle, { color: theme.muted }]}>
              Cambia la dirección del servidor al que se conecta la app
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? theme.accent : theme.accentAlt, boxShadow: theme.logoShadow }]}>
            <AppIcon color={theme.amber} name="⚙️" size={24} />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, boxShadow: theme.cardShadow }]}>
          <View style={[styles.cardIcon, { backgroundColor: theme.softIcon }]}>
            <AppIcon color={theme.amber} name="📡" size={20} />
          </View>
          <View style={styles.cardCopy}>
            <Text selectable style={[styles.cardTitle, { color: theme.title }]}>
              Dirección del servidor
            </Text>
            <Text selectable style={[styles.cardDescription, { color: theme.muted }]}>
              Escribe la IP de la computadora donde corre la API (misma red WiFi que tu teléfono).
            </Text>
          </View>
        </View>

        <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.inputBorder, boxShadow: theme.cardShadow }]}>
          <AppIcon color={theme.amber} name="📡" size={17} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setUrl}
            placeholder="192.168.0.17:8000"
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.statusText }]}
            value={url}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={theme.amber} size="large" style={styles.loader} />
        ) : (
          <>
            {error !== '' && <Text selectable style={[styles.error, { color: theme.danger || '#b91c1c' }]}>{error}</Text>}
            {message !== '' && <Text selectable style={[styles.success, { color: '#15803d' }]}>{message}</Text>}

            <Pressable
              accessibilityRole="button"
              onPress={handleTest}
              style={({ pressed }) => [
                styles.button,
                styles.buttonOutline,
                { borderColor: theme.amber, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {testing ? (
                <ActivityIndicator color={theme.amber} />
              ) : (
                <Text selectable style={[styles.buttonOutlineText, { color: theme.amber }]}>
                  Probar conexión
                </Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleSave}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                  boxShadow: theme.strongShadow,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.buttonText}>Guardar</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleReset}
              style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Text selectable style={[styles.resetText, { color: theme.muted }]}>
                Restablecer dirección por defecto
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 700,
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
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 32,
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
  card: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    minHeight: 76,
    padding: 14,
  },
  cardIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  cardDescription: {
    fontSize: 11,
    lineHeight: 15,
    paddingTop: 3,
  },
  inputBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    height: 52,
    marginTop: 14,
    paddingHorizontal: 15,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    minWidth: 0,
  },
  loader: {
    marginTop: 32,
  },
  error: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  success: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    marginTop: 14,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonOutlineText: {
    fontSize: 14,
    fontWeight: '800',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonArrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  resetButton: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
