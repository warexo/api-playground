import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useEnvironment } from './EnvironmentContext';
import { loadAuth, saveAuth, removeAuth } from '../utils/storage';
import { createApiClient } from '../utils/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { activeEnv, activeEnvId } = useEnvironment();
  const [authState, setAuthState] = useState({
    token: null,
    refreshToken: null,
    clientId: null,
    clients: [],
    user: null,
    isLoggedIn: false,
    isLoggingIn: false,
    error: null,
  });

  const authRef = useRef(authState);
  authRef.current = authState;
  const envRef = useRef(activeEnv);
  envRef.current = activeEnv;

  // Load persisted auth when environment changes
  useEffect(() => {
    if (!activeEnvId) {
      setAuthState((s) => ({
        ...s,
        token: null,
        refreshToken: null,
        clientId: null,
        clients: [],
        user: null,
        isLoggedIn: false,
        error: null,
      }));
      return;
    }

    const saved = loadAuth(activeEnvId);
    if (saved) {
      setAuthState((s) => ({
        ...s,
        token: saved.token,
        refreshToken: saved.refreshToken,
        clientId: saved.clientId,
        clients: saved.clients || [],
        user: saved.user || null,
        isLoggedIn: !!saved.token,
        error: null,
      }));
    } else {
      setAuthState((s) => ({
        ...s,
        token: null,
        refreshToken: null,
        clientId: null,
        clients: [],
        user: null,
        isLoggedIn: false,
        error: null,
      }));
    }
  }, [activeEnvId]);

  // Create API client with auto-refresh
  const apiClient = useRef(null);

  const onTokenRefreshed = useCallback(
    (newToken) => {
      setAuthState((s) => {
        const updated = { ...s, token: newToken };
        if (activeEnvId) {
          saveAuth(activeEnvId, {
            token: newToken,
            refreshToken: s.refreshToken,
            clientId: s.clientId,
            clients: s.clients,
            user: s.user,
          });
        }
        return updated;
      });
    },
    [activeEnvId]
  );

  const onAuthFailed = useCallback(() => {
    setAuthState((s) => ({
      ...s,
      token: null,
      refreshToken: null,
      isLoggedIn: false,
      error: 'Session expired. Please log in again.',
    }));
    if (activeEnvId) removeAuth(activeEnvId);
  }, [activeEnvId]);

  useEffect(() => {
    apiClient.current = createApiClient(
      () => envRef.current,
      () => authRef.current,
      onTokenRefreshed,
      onAuthFailed
    );
  }, [onTokenRefreshed, onAuthFailed]);

  const login = useCallback(async () => {
    if (!activeEnv?.url || !activeEnv?.username || !activeEnv?.password) {
      setAuthState((s) => ({ ...s, error: 'Please configure environment URL, username and password.' }));
      return;
    }

    setAuthState((s) => ({ ...s, isLoggingIn: true, error: null }));

    try {
      // Login
      const loginRes = await apiClient.current.post('/api/v1/login', {
        username: activeEnv.username,
        password: activeEnv.password,
      });

      const { token, refresh_token } = loginRes.data;

      // Temporarily set token for subsequent requests
      setAuthState((s) => ({ ...s, token, refreshToken: refresh_token }));
      authRef.current = { ...authRef.current, token, refreshToken: refresh_token };

      // Fetch clients
      let clients = [];
      try {
        const clientsRes = await apiClient.current.get(
          '/api/v1/entity/client?fields[]=id&fields[]=title&limit=100'
        );
        clients = Array.isArray(clientsRes.data) ? clientsRes.data : [];
      } catch {
        // Non-fatal: user might not have client access
      }

      // Fetch active user
      let user = null;
      try {
        const userRes = await apiClient.current.get('/api/v1/activeuser');
        user = userRes.data;
      } catch {
        // Non-fatal
      }

      const clientId = clients[0]?.id || null;

      const finalState = {
        token,
        refreshToken: refresh_token,
        clientId,
        clients,
        user,
        isLoggedIn: true,
        isLoggingIn: false,
        error: null,
      };

      setAuthState((s) => ({ ...s, ...finalState }));

      if (activeEnvId) {
        saveAuth(activeEnvId, {
          token,
          refreshToken: refresh_token,
          clientId,
          clients,
          user,
        });
      }
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data ||
        err.message ||
        'Login failed';
      setAuthState((s) => ({
        ...s,
        isLoggingIn: false,
        isLoggedIn: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      }));
    }
  }, [activeEnv, activeEnvId]);

  const logout = useCallback(() => {
    setAuthState({
      token: null,
      refreshToken: null,
      clientId: null,
      clients: [],
      user: null,
      isLoggedIn: false,
      isLoggingIn: false,
      error: null,
    });
    if (activeEnvId) removeAuth(activeEnvId);
  }, [activeEnvId]);

  const setClientId = useCallback(
    (clientId) => {
      setAuthState((s) => {
        const updated = { ...s, clientId };
        if (activeEnvId) {
          saveAuth(activeEnvId, {
            token: s.token,
            refreshToken: s.refreshToken,
            clientId,
            clients: s.clients,
            user: s.user,
          });
        }
        return updated;
      });
    },
    [activeEnvId]
  );

  const getApiClient = useCallback(() => apiClient.current, []);

  const value = {
    ...authState,
    login,
    logout,
    setClientId,
    getApiClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
