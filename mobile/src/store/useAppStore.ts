// src/store/useAppStore.ts — Lightweight global UI state.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DiscoverFilters, MatchingMode } from '@/src/types';

interface AppState {
  activeMode: MatchingMode;
  filters: DiscoverFilters;
  setActiveMode: (mode: MatchingMode) => void;
  setFilters: (patch: Partial<DiscoverFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: DiscoverFilters = {
  ageMin: 18,
  ageMax: 50,
  sameCity: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeMode: 'friendship',
      filters: defaultFilters,
      setActiveMode: (mode) => set({ activeMode: mode }),
      setFilters: (patch) =>
        set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'soullink.app.state',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
