import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'coffeeadmin.access_token';
const SESSION_KEY = 'coffeeadmin.session';
const secureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

const memoryStorage = new Map();

function getWebStorage() {
  try {
    return globalThis?.localStorage ?? null;
  } catch {
    return null;
  }
}

async function setItem(key, value) {
  if (Platform.OS !== 'web') {
    return SecureStore.setItemAsync(key, value, secureStoreOptions);
  }

  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

async function getItem(key) {
  if (Platform.OS !== 'web') {
    return SecureStore.getItemAsync(key, secureStoreOptions);
  }

  const webStorage = getWebStorage();
  return webStorage ? webStorage.getItem(key) : memoryStorage.get(key) ?? null;
}

async function removeItem(key) {
  if (Platform.OS !== 'web') {
    return SecureStore.deleteItemAsync(key, secureStoreOptions);
  }

  const webStorage = getWebStorage();
  if (webStorage) webStorage.removeItem(key);
  memoryStorage.delete(key);
}

export async function saveSession(session) {
  const accessToken = session?.accessToken || session?.access_token;
  if (!accessToken) {
    throw new Error('No se puede guardar una sesión sin access token.');
  }

  const { accessToken: omittedAccessToken, access_token: omittedApiToken, ...metadata } = session;

  try {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, String(accessToken)),
      setItem(SESSION_KEY, JSON.stringify(metadata)),
    ]);
  } catch (error) {
    await clearSession();
    throw error;
  }
}

export async function loadSession() {
  const [accessToken, serializedSession] = await Promise.all([
    getItem(ACCESS_TOKEN_KEY),
    getItem(SESSION_KEY),
  ]);

  if (!accessToken) return null;

  if (!serializedSession) return { accessToken };

  try {
    return {
      ...JSON.parse(serializedSession),
      accessToken,
    };
  } catch {
    await clearSession();
    return null;
  }
}

export async function getAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function clearSession() {
  await Promise.all([
    removeItem(ACCESS_TOKEN_KEY),
    removeItem(SESSION_KEY),
  ]);
}

export const sessionStorage = {
  save: saveSession,
  load: loadSession,
  getAccessToken,
  clear: clearSession,
};

export default sessionStorage;
