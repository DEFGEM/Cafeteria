import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
const rawTimeout = process.env.EXPO_PUBLIC_API_TIMEOUT_MS?.trim() ?? '';

const DEFAULT_TIMEOUT_MS = 15000;
const API_URL_STORAGE_KEY = 'cafeinable.api_url';

const secureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

function normalizeApiUrl(value) {
  return value.replace(/\/+$/, '');
}

function parseTimeout(value) {
  if (!value) return DEFAULT_TIMEOUT_MS;

  const timeout = Number(value);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS;
}

function getConfigurationError(apiUrl) {
  if (!apiUrl) {
    return 'Falta EXPO_PUBLIC_API_URL. Copia .env.example a .env.local y configura la URL de la API.';
  }

  if (!/^https?:\/\//i.test(apiUrl)) {
    return 'EXPO_PUBLIC_API_URL debe comenzar con http:// o https://.';
  }

  return null;
}

const defaultApiUrl = normalizeApiUrl(rawApiUrl);

let currentApiUrl = defaultApiUrl;
let loadedPromise = null;

export const environment = Object.freeze({
  apiTimeoutMs: parseTimeout(rawTimeout),
  isConfigured: getConfigurationError(defaultApiUrl) === null,
  configurationError: getConfigurationError(defaultApiUrl),
});

export async function getApiUrl() {
  await loadedPromise;
  return currentApiUrl;
}

export async function loadApiUrl() {
  if (loadedPromise) return loadedPromise;

  loadedPromise = (async () => {
    try {
      if (Platform.OS === 'web') return;

      const saved = await SecureStore.getItemAsync(API_URL_STORAGE_KEY, secureStoreOptions);
      if (saved) {
        currentApiUrl = normalizeApiUrl(saved);
      }
    } catch (error) {
      console.warn('No se pudo cargar la URL de la API guardada:', error);
    }
  })();

  try {
    await loadedPromise;
  } finally {
    loadedPromise = null;
  }

  return currentApiUrl;
}

function normalizeUserUrl(input) {
  let value = String(input || '').trim().replace(/\/+$/, '');
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }
  return value;
}

export async function saveApiUrl(input) {
  const normalized = normalizeUserUrl(input);

  if (!normalized) {
    await SecureStore.deleteItemAsync(API_URL_STORAGE_KEY, secureStoreOptions);
    currentApiUrl = defaultApiUrl;
    return currentApiUrl;
  }

  await SecureStore.setItemAsync(API_URL_STORAGE_KEY, normalized, secureStoreOptions);
  currentApiUrl = normalized;
  return currentApiUrl;
}

export async function resetApiUrl() {
  await SecureStore.deleteItemAsync(API_URL_STORAGE_KEY, secureStoreOptions);
  currentApiUrl = defaultApiUrl;
  return currentApiUrl;
}

export async function probarConexion(input, timeoutMs = 5000) {
  const url = normalizeUserUrl(input) || currentApiUrl;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${url}/docs`, { signal: controller.signal });
    return response.ok;
  } finally {
    clearTimeout(timer);
  }
}

export function requireApiUrl() {
  const error = getConfigurationError(currentApiUrl);
  if (error) {
    throw new Error(error);
  }

  return currentApiUrl;
}

export function resolveApiUrl(path = '') {
  const baseUrl = requireApiUrl();

  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;

  return `${baseUrl}/${String(path).replace(/^\/+/, '')}`;
}

export default environment;
