// src/services/socket.ts — Socket.io client singleton for chat + presence.
//
// A single socket instance is shared across the whole app. We lazily create
// it once Clerk has a token and tear it down on sign-out.

import { io, type Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(token: string | null): Socket {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5_000,
    timeout: 10_000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function currentSocket(): Socket | null {
  return socket;
}
