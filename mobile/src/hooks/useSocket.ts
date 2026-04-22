// src/hooks/useSocket.ts — connects to the chat socket for a given match.

import { getSocket } from '@/src/services/socket';
import type { Message } from '@/src/types';
import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface UseSocketParams {
  matchId: string;
  onMessage?: (msg: Message) => void;
  onTyping?: (userId: string) => void;
  onStopTyping?: (userId: string) => void;
  onReadReceipt?: (readBy: string) => void;
}

export function useSocket({
  matchId,
  onMessage,
  onTyping,
  onStopTyping,
  onReadReceipt,
}: UseSocketParams) {
  const { getToken } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const token = await getToken();
        if (cancelled) return;
        const socket = getSocket(token);
        socketRef.current = socket;

        const handleConnect = () => {
          if (!cancelled) {
            setConnected(true);
            socket.emit('join-room', matchId);
          }
        };

        const handleDisconnect = () => {
          if (!cancelled) setConnected(false);
        };

        if (socket.connected) handleConnect();
        else socket.once('connect', handleConnect);

        socket.on('disconnect', handleDisconnect);

        if (onMessage) socket.on('new-message', onMessage);
        if (onTyping)
          socket.on('user-typing', ({ userId }: { userId: string }) =>
            onTyping(userId)
          );
        if (onStopTyping)
          socket.on('user-stop-typing', ({ userId }: { userId: string }) =>
            onStopTyping(userId)
          );
        if (onReadReceipt)
          socket.on(
            'message-read',
            ({ readBy }: { readBy: string }) => onReadReceipt(readBy)
          );
      } catch {
        /* non-fatal; caller can still render */
      }
    }

    connect();

    return () => {
      cancelled = true;
      const s = socketRef.current;
      if (s) {
        s.emit('leave-room', matchId);
        if (onMessage) s.off('new-message', onMessage);
        s.off('user-typing');
        s.off('user-stop-typing');
        s.off('message-read');
        s.off('disconnect');
      }
    };
    // We intentionally want these callbacks to be latest-at-subscription; a
    // consumer changing callbacks mid-chat would re-subscribe, which is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const emit = (event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload);
  };

  return { connected, emit, socket: socketRef.current };
}
