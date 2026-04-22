// src/hooks/useAuthBridge.ts — wires Clerk's session token into the API client.
//
// CHANGE: Exposes `useTokenReady()` — a hook that returns true once the
// token getter has successfully returned a non-null token at least once.
// This lets app/index.tsx hold off the profile query until Clerk's token
// is genuinely available (not just "isSignedIn = true"), eliminating the
// race condition where the profile fetch fires before the JWT is ready.
//
// FIX: On sign-out, the React Query cache is now fully cleared. Previously
// only the token-ready flag and socket were reset. This meant that if a
// second user signed in on the same device within the gcTime window (10 min),
// the first user's cached profile (['profile','me']) was still in memory and
// would be returned immediately — causing the new user to be routed to (tabs)
// as if they already had an approved profile.

import { useQueryClient } from '@tanstack/react-query';
import { registerTokenGetter } from '@/src/services/api';
import { disconnectSocket } from '@/src/services/socket';
import { useAuth, useUser } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';

// Module-level subscribers so any component can listen without a Context.
type ReadyListener = (ready: boolean) => void;
let _tokenReady = false;
const _listeners = new Set<ReadyListener>();

function setTokenReady(value: boolean) {
  if (_tokenReady === value) return;
  _tokenReady = value;
  _listeners.forEach((fn) => fn(value));
}

/** Returns true once Clerk has produced a valid JWT at least once this session. */
export function useTokenReady(): boolean {
  const [ready, setReady] = useState(_tokenReady);

  useEffect(() => {
    // Sync in case it became true between render and effect
    if (_tokenReady !== ready) setReady(_tokenReady);

    _listeners.add(setReady);
    return () => {
      _listeners.delete(setReady);
    };
  }, []);

  return ready;
}

export function useAuthBridge(): void {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  // FIX: Access the QueryClient so we can wipe the cache on sign-out.
  // This prevents a previous user's profile from bleeding into a new session.
  const queryClient = useQueryClient();

  // Keep a ref so the token getter closure always calls the latest getToken
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Register synchronously on every render so the getter is in place before
  // any child component fires its first request.
  registerTokenGetter(async () => {
    try {
      const token = await getTokenRef.current();
      if (token) {
        // Signal to the rest of the app that a real token is available.
        setTokenReady(true);
      }
      return token;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!isSignedIn) {
      // Reset token-ready flag so after sign-out we start fresh.
      setTokenReady(false);
      disconnectSocket();

      // FIX: Clear ALL cached query data on sign-out.
      // Without this, a new user signing in on the same device within the
      // gcTime window (10 min) would receive the previous user's profile from
      // cache under the shared key ['profile', 'me'], bypassing onboarding
      // and routing straight to (tabs) as if already verified.
      queryClient.clear();
    }
  }, [isSignedIn, queryClient]);
}