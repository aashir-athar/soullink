// app/(verification)/_layout.tsx — Verification stack.

import React from 'react';
import { Stack } from 'expo-router';

export default function VerificationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
