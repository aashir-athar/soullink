// src/lib/tokenCache.ts — Clerk secure token cache for Expo
// Clerk's official pattern: SecureStore on native, noop on web.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { tokenCache } from '@clerk/expo/token-cache'

const createTokenCache = (): TokenCache => ({
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      await SecureStore.deleteItemAsync(key).catch(() => {
        /* ignore */
      });
      return null;
    }
  },
  async saveToken(key: string, token: string) {
    try {
      await SecureStore.setItemAsync(key, token);
    } catch {
      /* ignore — token will be refreshed */
    }
  },
});

// SecureStore is native-only; Clerk falls back to localStorage on web.
export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined;
