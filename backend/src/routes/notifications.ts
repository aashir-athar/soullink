// backend/src/routes/notifications.ts
// Updated: 2026-04-17

import { Router, type Request, type Response } from 'express';
import { Notification, User } from '../models/index.js';
import { requireUser } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const notifications = await Notification.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      res.json(notifications);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

notificationsRouter.patch(
  '/read-all',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await Notification.updateMany(
        { userId: req.userId, read: false },
        { read: true }
      );
      res.status(204).send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

notificationsRouter.post(
  '/push-token',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, platform } = req.body as {
        token: string;
        platform: 'ios' | 'android';
      };
      await User.findByIdAndUpdate(req.userId, {
        pushToken: token,
        pushPlatform: platform,
      });
      res.status(204).send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);
