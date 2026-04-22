// backend/src/routes/matches.ts
// Updated: 2026-04-17 | Express 5, Mongoose 9

import { Router, type Request, type Response } from 'express';
import { Match, Message, User } from '../models/index.js';
import { requireUser } from '../middleware/auth.js';

export const matchesRouter = Router();

matchesRouter.get(
  '/',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const matches = await Match.find({ users: req.userId, active: true })
        .sort({ updatedAt: -1 })
        .lean();

      const enriched = await Promise.all(
        matches.map(async (match) => {
          const otherId = match.users.find((u) => u !== req.userId);
          const otherUser = await User.findById(otherId)
            .select('fullName age city country photos interests')
            .lean();

          const lastMessage = await Message.findOne({
            matchId: (match._id as { toString(): string }).toString(),
          })
            .sort({ createdAt: -1 })
            .lean();

          const unreadCount = await Message.countDocuments({
            matchId: (match._id as { toString(): string }).toString(),
            senderId: { $ne: req.userId },
            status: { $ne: 'read' },
          });

          const mainPhoto =
            otherUser?.photos?.find(
              (p: { isMain: boolean }) => p.isMain
            ) ?? otherUser?.photos?.[0];

          return {
            _id: match._id,
            users: match.users,
            mode: match.mode,
            createdAt: match.createdAt,
            otherUser: {
              userId: otherId,
              fullName: otherUser?.fullName ?? 'Unknown',
              age: otherUser?.age ?? 0,
              city: otherUser?.city ?? '',
              country: otherUser?.country ?? '',
              mainPhoto: mainPhoto?.cloudinaryUrl ?? '',
              photoCount: otherUser?.photos?.length ?? 0,
              interests: otherUser?.interests ?? [],
              compatibilityScore: 0,
              gender: '',
              religion: '',
              mode: match.mode,
            },
            lastMessage,
            unreadCount,
          };
        })
      );

      res.json(enriched);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

matchesRouter.delete(
  '/:matchId',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const match = await Match.findOne({
        _id: req.params['matchId'],
        users: req.userId,
      });
      if (!match) {
        res.status(404).json({ message: 'Match not found' });
        return;
      }
      await Match.findByIdAndUpdate(req.params['matchId'], { active: false });
      res.status(204).send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);
