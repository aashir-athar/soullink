// src/store/useOnboardingStore.ts — Draft profile persisted through the
// 6-step onboarding wizard. Cleared once the profile is created.
//
// photos stores LocalPhoto objects (local URIs only) — never Cloudinary URLs.
// Upload happens atomically in step-6 on profile creation.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { OnboardingDraft } from '@/src/types';

const emptyDraft: OnboardingDraft = {
  fullName: '',
  gender: null,
  dateOfBirth: null,
  city: '',
  country: '',
  religion: 'prefer_not_to_say',
  photos: [],
  interests: [],
  lookingFor: [],
  bio: '',
  occupation: '',
  height: null,
  educationLevel: null,
  smoking: null,
  drinking: null,
  wantKids: null,
  personality: null,
};

interface OnboardingStore {
  draft: OnboardingDraft;
  currentStep: number;
  update: (patch: Partial<OnboardingDraft>) => void;
  setStep: (n: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      draft: emptyDraft,
      currentStep: 0,
      update: (patch) =>
        set((s) => ({ draft: { ...s.draft, ...patch } })),
      setStep: (n) => set({ currentStep: n }),
      reset: () => set({ draft: emptyDraft, currentStep: 0 }),
    }),
    {
      name: 'soullink.onboarding.draft',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);