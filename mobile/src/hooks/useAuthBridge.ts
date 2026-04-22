// src/hooks/useAuthBridge.ts — wires Clerk's session token into the API client.
//
// CHANGE: Exposes `useTokenReady()` — a hook that returns true once the
// token getter has successfully returned a non-null token at least once.
// This lets app/index.tsx hold off the profile query until Clerk's token
// is genuinely available (not just "isSignedIn = true"), eliminating the
// race condition where the profile fetch fires before the JWT is ready.

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
        console.log("token:", token);

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
    }
  }, [isSignedIn]);
}
