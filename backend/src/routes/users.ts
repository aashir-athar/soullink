// backend/src/routes/users.ts
// Updated: 2026-04-17

import { Router, type Request, type Response } from 'express';
import { User } from '../models/index.js';
import { requireUser } from '../middleware/auth.js';

export const usersRouter = Router();

usersRouter.get(
  '/:userId',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.params['userId'])
        .select(
          'fullName age city country gender religion photos interests bio occupation verificationStatus'
        )
        .lean();

      if (!user || user.verificationStatus !== 'approved') {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const mainPhoto =
        user.photos?.find((p: { isMain: boolean }) => p.isMain) ??
        user.photos?.[0];

      res.json({
        userId: (user._id as { toString(): string }).toString(),
        fullName: user.fullName,
        age: user.age,
        city: user.city,
        country: user.country,
        gender: user.gender,
        religion: user.religion,
        mainPhoto: mainPhoto?.cloudinaryUrl ?? '',
        photoCount: user.photos?.length ?? 0,
        photos: user.photos?.map((p: { cloudinaryUrl: string }) => p.cloudinaryUrl) ?? [],
        interests: user.interests,
        bio: user.bio,
        occupation: user.occupation,
        compatibilityScore: 0,
        mode: '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);
