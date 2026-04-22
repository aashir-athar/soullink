// app/(onboarding)/_layout.tsx — Onboarding stack.

import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // prevent accidental back-swipes mid-flow
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
