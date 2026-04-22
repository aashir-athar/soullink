// app/index.tsx — Entry point router.
//
// Flow:
//   Not signed in                            → /welcome
//   Signed in, token not yet ready           → loader  (JWT not yet produced from SecureStore)
//   Signed in, profile loading / retrying    → loader
//   Signed in, profile fetch errored (net)   → retry screen  ← NOT onboarding
//   Signed in, no profile (404 → null)       → /(onboarding)/step-1
//   Signed in, profile exists, not approved  → /(verification)/selfie
//   Signed in, profile exists, approved      → /(tabs)

import { useUser } from '@clerk/expo';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { SoulLinkLoader } from '@/src/components/ui/SoulLinkLoader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useMyProfile } from '@/src/hooks/useApi';
import { useTokenReady } from '@/src/hooks/useAuthBridge';

export default function Index() {
  const { isLoaded, user, isSignedIn } = useUser();
  const tokenReady = useTokenReady();
  const { theme } = useTheme();

  // Only fire the profile query once ALL THREE conditions are true:
  //  1. Clerk has finished initialising (isLoaded)
  //  2. The user is signed in (isSignedIn)
  //  3. A real JWT has been produced at least once (tokenReady)
  //
  // Without condition 3, on a cold-start the query fires while Clerk is still
  // restoring the session from SecureStore, gets a 401, and the retry storm
  // begins before the token is even available.
  const [profileEnabled, setProfileEnabled] = useState(!!isLoaded && !!isSignedIn && tokenReady);

  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
    isError: profileError,
    refetch,
  } = useMyProfile(profileEnabled);

  useEffect(() => {
    setProfileEnabled(!!isLoaded && !!isSignedIn && tokenReady);
    refetch();
    if (!profile) {
      console.log(profile);
      refetch();
    }
  }, [[user, isSignedIn, profile]]);

  // ── 1. Clerk not yet initialised ──────────────────────────────────────────
  if (!isLoaded) {
    return <SoulLinkLoader label="Starting up…" />;
  }

  // ── 2. Not signed in → welcome / auth ─────────────────────────────────────
  else if (!isSignedIn) {
    return <Redirect href="/welcome" />;
  }

  // ── 5. Hard failure: network error, 5xx, or exhausted retries ─────────────
  //
  //  IMPORTANT: Do NOT redirect to onboarding here. A network blip would wipe
  //  the user's onboarding progress and recreate a duplicate profile. Instead,
  //  show a friendly retry screen so the user can try again.
  else if (profileError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          paddingHorizontal: 32,
          gap: 20,
        }}
      >
        <Text style={{ fontSize: 40 }}>&#9829;</Text>
        <Text variant="title2" style={{ textAlign: 'center' }}>
          Connection issue
        </Text>
        <Text variant="body" tone="secondary" style={{ textAlign: 'center', lineHeight: 22 }}>
          We couldn&apos;t reach the server.{'\n'}Please check your connection and try again.
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{
            marginTop: 8,
            paddingVertical: 14,
            paddingHorizontal: 36,
            borderRadius: 14,
            backgroundColor: theme.colors.primary,
          }}
        >
          <Text variant="bodyMedium" style={{ color: '#fff' }}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── 6. 404 → no profile yet → onboarding ──────────────────────────────────
  else if (!profile) {
    refetch();
    if (!profile) {
      refetch();
      console.log(profile);
    }
    return <Redirect href="/(onboarding)/step-1" />;
  }

  // ── 7. Profile found but selfie not yet approved → verification ────────────
  else if (profile.verificationStatus !== 'approved') {
    return <Redirect href="/(verification)/selfie" />;
  }

  // ── 8. All checks passed → main app ───────────────────────────────────────
  else {
    return <Redirect href="/(tabs)" />;
  }

}
