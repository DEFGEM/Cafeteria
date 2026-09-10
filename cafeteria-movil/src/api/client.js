import { environment, loadApiUrl, resolveApiUrl } from '../config/environment';
import sessionStorage from '../storage/sessionStorage';
import { ApiError, createNetworkError, createResponseError } from './errors';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;

  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

function appendQueryValue(searchParams, key, value) {
  if (value === undefined || value === null || value === '') return;

  if (Array.isArray(value)) {
    value.forEach((item) => appendQueryValue(searchParams, key, item));
    return;
  }

  searchParams.append(key, String(value));
}

function buildUrl(path, query) {
  const url = resolveApiUrl(path);
  if (!query) return url;

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => appendQueryValue(searchParams, key, value));
  const queryString = searchParams.toString();

  return queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url;
}

function serializeBody(body, headers) {
  if (body === undefined || body === null) return undefined;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isSearchParams = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;

  if (isFormData || isSearchParams || typeof body === 'string') {
    if (isSearchParams && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
    }
    return isSearchParams ? body.toString() : body;
  }

  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return JSON.stringify(body);
}

async function parseResponse(response, responseType) {
  if (response.status === 204) return null;
  if (responseType === 'blob') return response.blob();
  if (responseType === 'arrayBuffer') return response.arrayBuffer();
  if (responseType === 'text') return response.text();

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function handleUnauthorized(error) {
  try {
    await sessionStorage.clear();
  } finally {
    await unauthorizedHandler?.(error);
  }
}

export async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let url;

  try {
    await loadApiUrl();
    url = buildUrl(path, options.query);
  } catch (error) {
    throw new ApiError(error.message, {
      code: 'CONFIGURATION_ERROR',
      method,
      cause: error,
    });
  }
  const headers = new Headers(options.headers || {});
  const timeoutMs = options.timeoutMs ?? environment.apiTimeoutMs;
  const controller = new AbortController();
  let timedOut = false;

  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  if (options.auth !== false) {
    const accessToken = await sessionStorage.getAccessToken();
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const body = serializeBody(options.body, headers);
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromCaller = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener?.('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const data = await parseResponse(response, response.ok ? options.responseType : undefined);

    if (!response.ok) {
      const error = createResponseError(response, data, { method, url });
      if (response.status === 401 && options.auth !== false) await handleUnauthorized(error);
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted && !timedOut) {
      throw new ApiError('La solicitud fue cancelada.', {
        code: 'REQUEST_ABORTED',
        method,
        url,
        cause: error,
      });
    }
    throw createNetworkError(error, { method, url }, timedOut);
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener?.('abort', abortFromCaller);
  }
}

export const httpClient = {
  request,
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};

export default httpClient;
