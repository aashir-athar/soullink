// app/_layout.tsx — Root layout: providers, auth bridge, splash screen.

import 'react-native-gesture-handler';

import { ClerkProvider } from '@clerk/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/src/components/ui/Toast';
import { ThemeProvider } from '@/src/contexts/ThemeContext';
import { useAuthBridge } from '@/src/hooks/useAuthBridge';
import { tokenCache } from '@/src/lib/tokenCache';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;


if (!CLERK_PUBLISHABLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Soullink] Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — auth will not work.'
  );
}

// React Query config — tuned for mobile:
//  - staleTime 60s so the deck + matches feel live but aren't hammered
//  - retry twice; beyond that we surface the error to the user
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Prevent auto-hide before we're ready.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

function InnerProviders({ children }: { children: React.ReactNode }) {
  useAuthBridge();
  return <>{children}</>;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Any pre-load tasks (fonts/assets) would go here. We unblock instantly.
    setReady(true);
    SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY!}
          tokenCache={tokenCache}
        >
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <ToastProvider>
                <InnerProviders>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                      animation: 'fade',
                    }}
                  />
                </InnerProviders>
              </ToastProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
