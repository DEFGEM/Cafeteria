function detailToMessage(detail) {
  if (typeof detail === 'string' && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || detailToMessage(item))
      .filter(Boolean)
      .join('\n');
  }

  if (detail && typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail);
  }

  return '';
}

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message || 'Ocurrió un error al comunicarse con la API.');
    this.name = 'ApiError';
    this.userMessage = message || 'Ocurrió un error al comunicarse con la API.';
    this.status = options.status ?? null;
    this.code = options.code ?? 'API_ERROR';
    this.detail = options.detail ?? null;
    this.data = options.data ?? null;
    this.method = options.method ?? null;
    this.url = options.url ?? null;
    this.isNetworkError = options.isNetworkError ?? false;
    this.isTimeout = options.isTimeout ?? false;
    this.cause = options.cause;
  }
}

export function createResponseError(response, data, request = {}) {
  const detail = data?.detail ?? data?.message ?? data?.error ?? data;
  const message = detailToMessage(detail) || `La API respondió con el estado ${response.status}.`;

  return new ApiError(message, {
    status: response.status,
    code: `HTTP_${response.status}`,
    detail,
    data,
    method: request.method,
    url: request.url,
  });
}

export function createNetworkError(error, request = {}, timedOut = false) {
  return new ApiError(
    timedOut
      ? 'La API tardó demasiado en responder. Intenta nuevamente.'
      : 'No fue posible conectar con la API. Revisa la red y la URL configurada.',
    {
      code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      method: request.method,
      url: request.url,
      isNetworkError: true,
      isTimeout: timedOut,
      cause: error,
    },
  );
}

export function isApiError(error) {
  return error instanceof ApiError;
}

export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  if (typeof error === 'string' && error.trim()) return error;
  if (error?.message) return error.message;
  return fallback;
}
