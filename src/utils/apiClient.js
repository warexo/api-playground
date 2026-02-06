import axios from 'axios';

/**
 * Creates an axios instance that routes through our proxy server
 * and injects the target URL + auth headers automatically.
 */
export function createApiClient(getEnv, getAuth, onTokenRefreshed, onAuthFailed) {
  const client = axios.create({
    baseURL: '/proxy',
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor: inject target URL and auth headers
  client.interceptors.request.use((config) => {
    const env = getEnv();
    const auth = getAuth();

    if (env?.url) {
      config.headers['X-Target-Url'] = env.url;
    }
    if (auth?.token) {
      config.headers['Authorization'] = `Bearer ${auth.token}`;
    }
    if (auth?.clientId) {
      config.headers['X-Client-Id'] = auth.clientId;
    }

    return config;
  });

  // Response interceptor: auto-refresh token on 401
  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Don't retry refresh or login requests
      if (
        error.response?.status !== 401 ||
        originalRequest._retry ||
        originalRequest.url?.includes('/api/v1/login') ||
        originalRequest.url?.includes('/api/v1/token/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const auth = getAuth();
      if (!auth?.refreshToken) {
        isRefreshing = false;
        onAuthFailed?.();
        return Promise.reject(error);
      }

      try {
        const env = getEnv();
        const refreshResponse = await axios.post(
          '/proxy/api/v1/token/refresh',
          { refresh_token: auth.refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Target-Url': env?.url || '',
            },
          }
        );

        const newToken = refreshResponse.data.token;
        onTokenRefreshed?.(newToken);
        processQueue(null, newToken);

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        onAuthFailed?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return client;
}
