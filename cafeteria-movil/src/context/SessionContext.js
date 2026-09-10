import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { setUnauthorizedHandler } from '../api/client';
import { ApiError } from '../api/errors';
import { getRoleDefinition } from '../adapters/roleAdapter';
import authService from '../services/authService';
import sessionStorage from '../storage/sessionStorage';

const defaultValue = {
  __isDefaultContext: true,
  session: null,
  isAuthenticated: false,
  isBootstrapping: true,
  isLoading: false,
  authError: null,
  currentRole: null,
  currentRoleId: null,
  userProfile: null,
  login: async () => null,
  logout: async () => {},
  refreshSession: async () => null,
  updateProfile: async () => null,
  clearAuthError: () => {},
};

const SessionContext = createContext(defaultValue);

function mergeSessionUser(session, user) {
  const role = user?.role ?? session?.role ?? session?.user?.role ?? null;

  return {
    ...session,
    role,
    user: {
      ...session?.user,
      ...user,
      role,
    },
  };
}

function createUserProfile(session, roleDefinition) {
  const user = session?.user;
  if (!user) return null;

  return {
    id: user.id,
    name: user.name || user.email || 'Usuario',
    role: roleDefinition?.label || user.apiRole || '',
    email: user.email || '',
    phone: user.phone || '',
    shift: user.shift || '',
    active: user.active,
  };
}

export function SessionProvider({
  children,
  initialSession,
  validateSession = true,
  onSessionChange,
}) {
  const [session, setSession] = useState(initialSession ?? null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const mountedRef = useRef(true);

  const clearLocalSession = useCallback(async () => {
    await sessionStorage.clear();
    if (mountedRef.current) setSession(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const removeUnauthorizedHandler = setUnauthorizedHandler((error) => {
      if (!mountedRef.current) return;
      setSession(null);
      setAuthError(error);
    });

    async function bootstrap() {
      try {
        const restored = initialSession ?? await sessionStorage.load();

        if (!restored?.accessToken) {
          if (mountedRef.current) setSession(null);
          return;
        }

        if (initialSession) await sessionStorage.save(restored);

        let nextSession = restored;
        if (validateSession) {
          try {
            const user = await authService.me();
            nextSession = mergeSessionUser(restored, user);
            await sessionStorage.save(nextSession);
          } catch (error) {
            if (error?.status === 401) {
              await clearLocalSession();
              return;
            }

            if (mountedRef.current) setAuthError(error);
          }
        }

        if (mountedRef.current) setSession(nextSession);
      } catch (error) {
        await clearLocalSession();
        if (mountedRef.current) setAuthError(error);
      } finally {
        if (mountedRef.current) setIsBootstrapping(false);
      }
    }

    bootstrap();

    return () => {
      mountedRef.current = false;
      removeUnauthorizedHandler();
    };
  }, [clearLocalSession, initialSession, validateSession]);

  useEffect(() => {
    if (!isBootstrapping) onSessionChange?.(session);
  }, [isBootstrapping, onSessionChange, session]);

  const login = useCallback(async (credentialsOrEmail, password) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      let nextSession = await authService.login(credentialsOrEmail, password);
      await sessionStorage.save(nextSession);

      try {
        const user = await authService.me();
        nextSession = mergeSessionUser(nextSession, user);
        await sessionStorage.save(nextSession);
      } catch (error) {
        if (error?.status === 401) throw error;
      }

      if (mountedRef.current) setSession(nextSession);
      return nextSession;
    } catch (error) {
      await clearLocalSession();
      if (mountedRef.current) setAuthError(error);
      throw error;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [clearLocalSession]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await clearLocalSession();
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [clearLocalSession]);

  const refreshSession = useCallback(async () => {
    const restored = session ?? await sessionStorage.load();
    if (!restored?.accessToken) return null;

    setIsLoading(true);
    setAuthError(null);

    try {
      const user = await authService.me();
      const nextSession = mergeSessionUser(restored, user);
      await sessionStorage.save(nextSession);
      if (mountedRef.current) setSession(nextSession);
      return nextSession;
    } catch (error) {
      if (error?.status === 401) await clearLocalSession();
      if (mountedRef.current) setAuthError(error);
      throw error;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [clearLocalSession, session]);

  const updateProfile = useCallback(async (profile) => {
    if (!session?.accessToken) return null;
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await authService.updateMe(profile);
      const nextSession = mergeSessionUser(session, user);
      await sessionStorage.save(nextSession);
      if (mountedRef.current) setSession(nextSession);
      return user;
    } catch (error) {
      if (mountedRef.current) setAuthError(error);
      throw error;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [session]);

  const clearAuthError = useCallback(() => setAuthError(null), []);
  const currentRoleId = session?.role ?? session?.user?.role ?? null;
  const currentRole = useMemo(() => getRoleDefinition(currentRoleId), [currentRoleId]);
  const userProfile = useMemo(() => createUserProfile(session, currentRole), [currentRole, session]);

  const value = useMemo(() => ({
    session,
    isAuthenticated: Boolean(session?.accessToken),
    isBootstrapping,
    isLoading,
    authError,
    currentRole,
    currentRoleId,
    userProfile,
    login,
    logout,
    refreshSession,
    updateProfile,
    clearAuthError,
  }), [
    authError,
    clearAuthError,
    currentRole,
    currentRoleId,
    isBootstrapping,
    isLoading,
    login,
    logout,
    refreshSession,
    session,
    updateProfile,
    userProfile,
  ]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context || context.__isDefaultContext) {
    throw new ApiError('useSession debe utilizarse dentro de SessionProvider.', {
      code: 'SESSION_PROVIDER_MISSING',
    });
  }

  return context;
}

export default SessionContext;
