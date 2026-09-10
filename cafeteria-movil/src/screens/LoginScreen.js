import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import AppIcon from '../components/AppIcon';

export default function LoginScreen({
  authError,
  isDarkMode,
  isLoginLoading = false,
  login,
  navigate,
  roleOptions = [],
  setIsDarkMode,
  theme,
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier || !password.trim()) {
      Alert.alert('Campos vacíos', 'Ingresa tu usuario y contraseña para continuar.');
      return;
    }

    try {
      await login?.(normalizedIdentifier, password);
    } catch (error) {
      Alert.alert(
        'No se pudo iniciar sesión',
        error?.userMessage || error?.message || 'Verifica tus credenciales y la conexión con la API.',
      );
    }
  };

  const fillAccount = (account) => {
    setIdentifier(account.email);
  };

  return (
    <ScreenBackground
      contentStyle={styles.screen}
      gradientColors={isDarkMode ? ['#1a130d', '#21170f', '#17110d'] : ['#f8e7b5', '#fff5d8', '#fffdf8']}
      isDarkMode={isDarkMode}
      theme={theme}
    >
      <View style={styles.content}>
        <MockStatusBar
          isDarkMode={isDarkMode}
          menuMode="themeOnly"
          navigate={navigate}
          setIsDarkMode={setIsDarkMode}
          theme={theme}
        />

        <View style={styles.settingsRow}>
          <Pressable
            accessibilityLabel="Configurar servidor"
            accessibilityRole="button"
            onPress={() => navigate?.('serverConfig')}
            style={({ pressed }) => [
              styles.settingsButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
                boxShadow: theme.cardShadow,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <AppIcon color={theme.amber} name="⚙️" size={20} />
            <Text selectable style={[styles.settingsText, { color: theme.muted }]}>
              Servidor
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View
            style={[
              styles.logo,
              {
                backgroundColor: isDarkMode ? '#92400e' : theme.accent,
                boxShadow: theme.logoShadow,
              },
            ]}
          >
            <AppIcon color="#ffffff" name="cafe" size={29} />
          </View>

          <Text selectable style={[styles.title, { color: theme.title }]}>CoffeeAdmin</Text>
          <Text selectable style={[styles.subtitle, { color: theme.subtitle }]}>Controla pedidos, caja e inventario</Text>

          <View style={styles.form}>
            <LoginInput
              icon="✉"
              onChangeText={setIdentifier}
              placeholder="Correo o usuario"
              theme={theme}
              value={identifier}
            />

            <LoginInput
              icon="🔒"
              onChangeText={setPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
              showPassword={showPassword}
              theme={theme}
              value={password}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isLoginLoading}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  backgroundColor: isDarkMode ? theme.accent : theme.accentAlt,
                  boxShadow: theme.strongShadow,
                  opacity: isLoginLoading ? 0.6 : pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={styles.loginText}>{isLoginLoading ? 'Conectando…' : 'Iniciar sesión'}</Text>
              <Text style={styles.loginArrow}>→</Text>
            </Pressable>
          </View>

          {authError ? (
            <Text selectable style={[styles.loginError, { color: theme.danger || '#b91c1c' }]}>
              {authError.userMessage || authError.message || String(authError)}
            </Text>
          ) : null}

          <Text selectable style={[styles.accessText, { color: theme.muted }]}>Acceso según rol: Mesero, Caja, Cocina o Admin</Text>

          <View style={[styles.brandCard, { backgroundColor: theme.surfaceAlt }]}>
            <Text selectable style={[styles.brandTitle, { color: theme.title }]}>Tu cafetería de confianza</Text>
            <Text selectable style={[styles.brandCopy, { color: theme.muted }]}>Cálido y sencillo para pasar un buen rato</Text>
          </View>

          <View
            style={[
              styles.credentials,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
                boxShadow: theme.cardShadow,
              },
            ]}
          >
            <Text selectable style={[styles.credentialsTitle, { color: theme.title }]}>Usuarios disponibles</Text>
            <Text selectable style={[styles.credentialsNote, { color: theme.muted }]}>Selecciona un rol para llenar el correo</Text>

            {roleOptions.map((account, index) => (
              <Pressable
                accessibilityHint="Llena automáticamente el formulario"
                accessibilityRole="button"
                key={account.id}
                onPress={() => fillAccount(account)}
                style={({ pressed }) => [
                  styles.accountRow,
                  {
                    borderBottomColor: theme.inputBorder,
                    borderBottomWidth: index === roleOptions.length - 1 ? 0 : 1,
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <View style={[styles.accountIcon, { backgroundColor: theme.softIcon }]}>
                  <AppIcon color={theme.amber} name={account.icon} size={19} />
                </View>
                <View style={styles.accountInfo}>
                  <Text selectable style={[styles.accountRole, { color: theme.title }]}>{account.label}</Text>
                  <Text selectable style={[styles.accountEmail, { color: theme.muted }]}>{account.email}</Text>
                </View>
                <View style={[styles.passwordBadge, { backgroundColor: theme.surfaceAlt }]}>
                  <Text selectable style={[styles.passwordBadgeText, { color: theme.accent }]}>Usar</Text>
                </View>
              </Pressable>
            ))}

            <Text selectable style={[styles.credentialsHelp, { color: theme.muted }]}>La contraseña nunca se guarda en esta pantalla.</Text>
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

function LoginInput({ icon, onChangeText, onTogglePassword, placeholder, secureTextEntry, showPassword, theme, value }) {
  const isPassword = Boolean(onTogglePassword);

  return (
    <View
      style={[
        styles.inputBox,
        {
          backgroundColor: theme.surface,
          borderColor: theme.inputBorder,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <AppIcon color={theme.amber} name={icon} size={17} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={isPassword ? 'default' : 'email-address'}
        onChangeText={onChangeText}
        onSubmitEditing={isPassword ? undefined : null}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        secureTextEntry={secureTextEntry}
        style={[styles.input, { color: theme.statusText }]}
        value={value}
      />
      {isPassword && (
        <Pressable
          accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onTogglePassword}
          style={({ pressed }) => [styles.passwordToggle, { opacity: pressed ? 0.55 : 1 }]}
        >
          <Text style={[styles.passwordToggleText, { color: theme.muted }]}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { minHeight: 860 },
  content: {
    flex: 1,
    minHeight: 860,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    position: 'relative',
    zIndex: 1,
  },
  card: {
    alignSelf: 'center',
    maxWidth: 440,
    paddingTop: 22,
    width: '100%',
  },
  settingsRow: {
    alignItems: 'flex-end',
    paddingTop: 14,
  },
  settingsButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 13,
  },
  settingsText: {
    fontSize: 12,
    fontWeight: '800',
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 14,
    width: 64,
  },
  logoIcon: { fontSize: 28 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 12, marginBottom: 26, marginTop: 4, textAlign: 'center' },
  form: { gap: 12 },
  inputBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    height: 52,
    paddingHorizontal: 15,
    width: '100%',
  },
  inputIcon: { fontSize: 16, textAlign: 'center', width: 19 },
  input: { flex: 1, fontSize: 14, height: '100%', minWidth: 0 },
  passwordToggle: { alignItems: 'center', height: 40, justifyContent: 'center', paddingLeft: 8 },
  passwordToggleText: { fontSize: 11, fontWeight: '800' },
  loginButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    marginTop: 2,
  },
  loginText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  loginArrow: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  loginError: { fontSize: 11, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  accessText: { fontSize: 11, marginTop: 14, textAlign: 'center' },
  brandCard: { alignItems: 'center', borderCurve: 'continuous', borderRadius: 16, marginTop: 18, padding: 13 },
  brandTitle: { fontSize: 12, fontWeight: '800' },
  brandCopy: { fontSize: 11, marginTop: 2 },
  credentials: { borderCurve: 'continuous', borderRadius: 18, borderWidth: 1, marginTop: 16, padding: 14 },
  credentialsTitle: { fontSize: 15, fontWeight: '900' },
  credentialsNote: { fontSize: 11, marginBottom: 8, marginTop: 2 },
  accountRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 58, paddingVertical: 8 },
  accountIcon: { alignItems: 'center', borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  accountIconText: { fontSize: 18 },
  accountInfo: { flex: 1, minWidth: 0 },
  accountRole: { fontSize: 12.5, fontWeight: '800' },
  accountEmail: { fontSize: 10.5, marginTop: 2 },
  passwordBadge: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },
  passwordBadgeText: { fontSize: 11, fontWeight: '800' },
  credentialsHelp: { fontSize: 10.5, marginTop: 10, textAlign: 'center' },
});
