// backend/src/socket.ts — Real-time socket handlers
// Updated: 2026-04-17 | @clerk/express 2.x, Socket.io 4.8 (connectionStateRecovery)

import type { Server, Socket } from 'socket.io';
import { createClerkClient } from '@clerk/express';
import { User, Message } from './models/index.js';
import { logger } from './services/logger.js';

const clerk = createClerkClient({
  secretKey: process.env['CLERK_SECRET_KEY']!,
});

export function registerSocketHandlers(io: Server): void {
  // ─── Auth middleware ─────────────────────────────────────────────────────────
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.['token'] as string | undefined;
      if (!token) return next(new Error('No auth token'));

      const payload = await clerk.verifyToken(token, {
        jwtKey: process.env['CLERK_JWT_KEY'],
      });

      const user = await User.findOne({ clerkId: payload.sub })
        .select('_id')
        .lean();
      if (!user) return next(new Error('User not found'));

      (socket as Socket & { userId: string }).userId = (
        user._id as { toString(): string }
      ).toString();

      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  // ─── Connection handlers ─────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = (socket as Socket & { userId: string }).userId;
    logger.info(`[Socket] User connected: ${userId}`);

    // Join personal room for direct notifications
    void socket.join(`user:${userId}`);

    socket.on('join-room', (matchId: string) => {
      void socket.join(matchId);
      logger.info(`[Socket] ${userId} joined room: ${matchId}`);
    });

    socket.on('leave-room', (matchId: string) => {
      void socket.leave(matchId);
    });

    socket.on('typing', ({ matchId }: { matchId: string }) => {
      socket.to(matchId).emit('user-typing', { userId, matchId });
    });

    socket.on('stop-typing', ({ matchId }: { matchId: string }) => {
      socket.to(matchId).emit('user-stop-typing', { userId, matchId });
    });

    socket.on(
      'mark-read',
      async ({ matchId }: { matchId: string }) => {
        try {
          await Message.updateMany(
            {
              matchId,
              senderId: { $ne: userId },
              status: { $ne: 'read' },
            },
            { status: 'read' }
          );
          io.to(matchId).emit('message-read', { matchId, readBy: userId });
        } catch (err) {
          logger.error('[Socket] mark-read error:', err);
        }
      }
    );

    socket.on('disconnect', (reason: string) => {
      logger.info(`[Socket] User disconnected: ${userId} (${reason})`);
    });
  });
}
