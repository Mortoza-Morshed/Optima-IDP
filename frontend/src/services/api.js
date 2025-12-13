import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

// Optional callback so the auth store can stay in sync when tokens change here
let tokenListener = null;
export const registerTokenListener = (listener) => {
  tokenListener = listener;
  // Return unsubscribe so consumers can clean up on unmount
  return () => {
    if (tokenListener === listener) {
      tokenListener = null;
    }
  };
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach access token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken() {
  const storedRefresh = localStorage.getItem('refreshToken');
  if (!storedRefresh) throw new Error('No refresh token');

  const client = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
  });

  const res = await client.post('/auth/refresh', { refreshToken: storedRefresh });
  const newAccess = res.data?.accessToken;
  const newRefresh = res.data?.refreshToken ?? storedRefresh;
  const newUser = res.data?.user;
  if (!newAccess) throw new Error('No access token returned');

  localStorage.setItem('accessToken', newAccess);
  localStorage.setItem('refreshToken', newRefresh);

  if (tokenListener) {
    tokenListener({
      accessToken: newAccess,
      refreshToken: newRefresh,
      ...(newUser ? { user: newUser } : {})
    });
  }
  return { accessToken: newAccess, refreshToken: newRefresh };
}

// Response interceptor with single-flight refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;
    const isAuthError = status === 401;
    const path = original?.url || '';
    const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/register');

    if (isAuthError && !isAuthEndpoint && !original?._retry) {
      original._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken()
          .catch((err) => {
            // Bubble up logout event
            if (tokenListener) tokenListener({ accessToken: null, refreshToken: null, user: null, forceLogout: true });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw err;
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        const refreshed = await refreshPromise;
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return api(original);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unexpected error occurred';
    // eslint-disable-next-line no-console
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default api;

