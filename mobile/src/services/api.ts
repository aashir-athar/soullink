// src/services/api.ts — Axios client for the Soullink backend.

import axios, { type AxiosError, type AxiosInstance } from 'axios';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export const registerTokenGetter = (getter: TokenGetter) => {
  tokenGetter = getter;
};

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      /* proceed without — server will 401 and caller can re-auth */
    }
  }

  // For multipart/form-data requests, remove the default Content-Type so
  // the browser/RN runtime can set it with the correct boundary parameter.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'Something went wrong. Please try again.';
    return Promise.reject(
      Object.assign(new Error(message), {
        status: error.response?.status,
        original: error,
      })
    );
  }
);

export const API_BASE_URL = API_URL;