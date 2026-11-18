import axios from 'axios';

import { ROUTES, TOKEN_STORAGE_KEY } from '../utils/constants';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (window.location.pathname !== ROUTES.login) {
          window.location.href = ROUTES.login;
        }
      }
    }
    return Promise.reject(error);
  },
);
