import httpClient from '../api/client';
import { ApiError } from '../api/errors';
import endpoints from '../api/endpoints';
import { adaptAuthSession, adaptUser } from '../adapters/roleAdapter';

function normalizeCredentials(emailOrCredentials, password) {
  if (typeof emailOrCredentials === 'object' && emailOrCredentials !== null) {
    return {
      email: emailOrCredentials.email ?? emailOrCredentials.username ?? '',
      password: emailOrCredentials.password ?? '',
    };
  }

  return { email: emailOrCredentials ?? '', password: password ?? '' };
}

export async function login(emailOrCredentials, password) {
  const credentials = normalizeCredentials(emailOrCredentials, password);
  const email = String(credentials.email).trim().toLowerCase();

  if (!email || !credentials.password) {
    throw new ApiError('Escribe tu correo y contraseña.', { code: 'INVALID_CREDENTIALS' });
  }

  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', credentials.password);

  const response = await httpClient.post(endpoints.auth.login, body, { auth: false });
  return adaptAuthSession(response, { email });
}

export async function me() {
  const response = await httpClient.get(endpoints.auth.me);
  return adaptUser(response);
}

export async function updateMe(profile) {
  const response = await httpClient.put(endpoints.auth.me, {
    email: profile.email,
    nombre_completo: profile.name,
  });
  return adaptUser(response);
}

export const authService = { login, me, updateMe };

export default authService;
