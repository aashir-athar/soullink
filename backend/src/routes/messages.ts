// backend/src/routes/messages.ts
// Updated: 2026-04-17 | Express 5, Mongoose 9

import { Router, type Request, type Response } from 'express';
import { Match, Message } from '../models/index.js';
import { requireUser } from '../middleware/auth.js';

export const messagesRouter = Router();

messagesRouter.get(
  '/:matchId',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId } = req.params;
      const { page = '1' } = req.query;
      const limit = 40;
      const skip = (parseInt(page as string) - 1) * limit;

      // Verify user is in this match
      const match = await Match.findOne({ _id: matchId, users: req.userId });
      if (!match) {
        res.status(403).json({ message: 'Not authorized' });
        return;
      }

      const messages = await Message.find({ matchId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Message.countDocuments({ matchId });

      res.json({ messages: messages.reverse(), hasMore: skip + limit < total });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

messagesRouter.post(
  '/:matchId',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId } = req.params;
      const { content } = req.body as { content?: string };

      if (!content?.trim()) {
        res.status(400).json({ message: 'Message content is required' });
        return;
      }

      const match = await Match.findOne({
        _id: matchId,
        users: req.userId,
        active: true,
      });
      if (!match) {
        res.status(403).json({ message: 'Not authorized or match inactive' });
        return;
      }

      const msg = await Message.create({
        matchId,
        senderId: req.userId,
        content: content.trim(),
        status: 'sent',
      });

      // Update match updatedAt
      await Match.findByIdAndUpdate(matchId, { updatedAt: new Date() });

      // Emit via socket
      try {
        const { io } = await import('../index.js');
        io.to(matchId).emit('new-message', msg);
      } catch {
        // Socket not critical — message is persisted regardless
      }

      res.status(201).json(msg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

messagesRouter.patch(
  '/:matchId/read',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await Message.updateMany(
        {
          matchId: req.params['matchId'],
          senderId: { $ne: req.userId },
          status: { $ne: 'read' },
        },
        { $set: { status: 'read' } }
      );
      res.status(204).send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);
