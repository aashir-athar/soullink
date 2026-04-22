// backend/src/routes/safety.ts
// Updated: 2026-04-17

import { Router, type Request, type Response } from 'express';
import { User, Match, Report } from '../models/index.js';
import { requireUser } from '../middleware/auth.js';

export const safetyRouter = Router();

safetyRouter.post(
  '/report',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { reportedUserId, reason, details } = req.body as {
        reportedUserId?: string;
        reason?: string;
        details?: string;
      };
      if (!reportedUserId || !reason) {
        res
          .status(400)
          .json({ message: 'reportedUserId and reason are required' });
        return;
      }
      await Report.create({
        reporterUserId: req.userId,
        reportedUserId,
        reason,
        details,
      });
      res.status(201).json({ message: 'Report submitted' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

safetyRouter.post(
  '/block',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { blockedUserId } = req.body as { blockedUserId: string };
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { blockedUsers: blockedUserId },
      });
      // Deactivate any match between them
      await Match.updateMany(
        { users: { $all: [req.userId, blockedUserId] } },
        { active: false }
      );
      res.status(204).send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

safetyRouter.delete(
  '/block/:blockedUserId',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await User.findByIdAndUpdate(req.userId, {
        $pull: { blockedUsers: req.params['blockedUserId'] },
      });
      res.status(204).send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

safetyRouter.get(
  '/blocked',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.userId)
        .select('blockedUsers')
        .lean();
      res.json(user?.blockedUsers ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);
