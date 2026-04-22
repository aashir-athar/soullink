// backend/src/routes/discover.ts — Discovery + swipe + daily limits
// Express 5, express-rate-limit 8.x

import { Router, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { User, Swipe, Match, Notification } from '../models/index.js';
import { requireUser, requireVerified } from '../middleware/auth.js';
import { differenceInCalendarDays } from 'date-fns';

export const discoverRouter = Router();

const DAILY_LIKES = 100;
const DAILY_COMPLIMENTS = 5;

const swipeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many swipe requests, please slow down.' },
});

async function checkAndResetLimits(userId: string): Promise<void> {
  const user = await User.findById(userId).select(
    'likesUsedToday complimentsUsedToday lastLimitReset'
  );
  if (!user) return;
  const days = differenceInCalendarDays(new Date(), user.lastLimitReset);
  if (days >= 1) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        likesUsedToday: 0,
        complimentsUsedToday: 0,
        lastLimitReset: new Date(),
      },
    });
  }
}

// ─── GET /api/discover/limits ─────────────────────────────────────────────────
// MUST be registered before /:mode to avoid being swallowed as a param match
discoverRouter.get(
  '/limits',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await checkAndResetLimits(req.userId);
      const user = await User.findById(req.userId)
        .select('likesUsedToday complimentsUsedToday lastLimitReset')
        .lean();

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const now = new Date();
      const nextReset = new Date(now);
      nextReset.setUTCHours(19, 0, 0, 0); // 19:00 UTC = midnight PKT
      if (nextReset <= now) nextReset.setUTCDate(nextReset.getUTCDate() + 1);

      res.json({
        likesUsed: user.likesUsedToday,
        likesLimit: DAILY_LIKES,
        complimentsUsed: user.complimentsUsedToday,
        complimentsLimit: DAILY_COMPLIMENTS,
        resetTime: nextReset.toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

// ─── GET /api/discover/:mode — Paginated profile feed ────────────────────────
discoverRouter.get(
  '/:mode',
  requireUser,
  requireVerified,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { mode } = req.params;
      const {
        page = '1',
        ageMin = '18',
        ageMax = '70',
        sameCity = 'false',
      } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limit = 20;
      const skip = (pageNum - 1) * limit;

      const viewer = await User.findById(req.userId).lean();
      if (!viewer) {
        res.status(404).json({ message: 'Profile not found' });
        return;
      }

      const swiped = await Swipe.find({ fromUserId: req.userId })
        .select('toUserId')
        .lean();
      const swipedIds = swiped.map((s) => s.toUserId);

      const excludeIds = [req.userId, ...swipedIds, ...(viewer.blockedUsers ?? [])];

      const query: Record<string, unknown> = {
        _id: { $nin: excludeIds },
        verificationStatus: 'approved',
        profileStatus: 'active',
        lookingFor: mode,
        age: {
          $gte: parseInt(ageMin as string),
          $lte: parseInt(ageMax as string),
        },
        blockedUsers: { $nin: [req.userId] },
      };

      if (mode === 'relationship' || mode === 'marriage') {
        query['gender'] = viewer.gender === 'male' ? 'female' : 'male';
      }

      if (mode === 'marriage' && viewer.religion !== 'prefer_not_to_say') {
        query['religion'] = viewer.religion;
      }

      if (sameCity === 'true') {
        query['city'] = viewer.city;
      }

      const candidates = await User.find(query)
        .select(
          'fullName age city country gender religion photos interests bio ' +
          'wantKids smoking personality height educationLevel occupation'
        )
        .skip(skip)
        .limit(limit)
        .lean();

      const scored = candidates.map((c) => {
        let score = 0;

        const ageDiff = Math.abs(viewer.age - c.age);
        score +=
          ageDiff <= 2 ? 20 : ageDiff <= 5 ? 15 : ageDiff <= 10 ? 10 : ageDiff <= 15 ? 5 : 2;

        score +=
          c.city === viewer.city ? 25 : c.country === viewer.country ? 12 : 3;

        const viewerSet = new Set(viewer.interests);
        const common = c.interests.filter((i: string) => viewerSet.has(i)).length;
        const ratio = common / Math.max(viewer.interests.length, 1);
        score +=
          ratio >= 0.5 ? 30 : ratio >= 0.3 ? 22 : ratio >= 0.15 ? 14 : common > 0 ? 7 : 0;

        if (viewer.wantKids && c.wantKids === viewer.wantKids) score += 5;
        if (viewer.smoking && c.smoking === viewer.smoking) score += 4;
        if (viewer.personality && c.personality === viewer.personality) score += 3;

        if (c.educationLevel === viewer.educationLevel) score += 10;
        else if (c.educationLevel) score += 3;

        const mainPhoto =
          c.photos?.find((p: { isMain: boolean }) => p.isMain) ?? c.photos?.[0];

        return {
          userId: (c._id as { toString(): string }).toString(),
          fullName: c.fullName,
          age: c.age,
          city: c.city,
          country: c.country,
          gender: c.gender,
          religion: c.religion,
          mainPhoto: mainPhoto?.cloudinaryUrl ?? '',
          photoCount: c.photos?.length ?? 0,
          interests: c.interests.slice(0, 6),
          bio: c.bio,
          compatibilityScore: Math.min(100, score),
          mode,
        };
      });

      scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      res.json({ profiles: scored, hasMore: candidates.length === limit });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

// ─── POST /api/discover/swipe ─────────────────────────────────────────────────
discoverRouter.post(
  '/swipe',
  requireUser,
  requireVerified,
  swipeLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { targetUserId, action, mode, compliment } = req.body as {
        targetUserId: string;
        action: 'like' | 'pass';
        mode: string;
        compliment?: string;
      };

      await checkAndResetLimits(req.userId);

      const viewer = await User.findById(req.userId).select(
        'likesUsedToday complimentsUsedToday'
      );
      if (!viewer) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (action === 'like') {
        if (viewer.likesUsedToday >= DAILY_LIKES) {
          res.status(429).json({ message: 'Daily like limit reached' });
          return;
        }
        if (compliment && viewer.complimentsUsedToday >= DAILY_COMPLIMENTS) {
          res.status(429).json({ message: 'Daily compliment limit reached' });
          return;
        }
      }

      await Swipe.findOneAndUpdate(
        { fromUserId: req.userId, toUserId: targetUserId, mode },
        { action, compliment },
        { upsert: true, new: true }
      );

      if (action === 'like') {
        const inc: Record<string, number> = { likesUsedToday: 1 };
        if (compliment) inc['complimentsUsedToday'] = 1;
        await User.findByIdAndUpdate(req.userId, { $inc: inc });
      }

      let isMatch = false;
      let matchId: string | undefined;

      if (action === 'like') {
        const theyLikedMe = await Swipe.findOne({
          fromUserId: targetUserId,
          toUserId: req.userId,
          action: 'like',
          mode,
        });

        if (theyLikedMe) {
          const userIds = [req.userId, targetUserId].sort();
          let match = await Match.findOne({ users: { $all: userIds }, mode });

          if (!match) {
            match = await Match.create({ users: userIds, mode });

            await Notification.insertMany([
              {
                userId: req.userId,
                type: 'match',
                title: 'New Match',
                body: 'You have a new match. Say hello.',
                data: { matchId: (match._id as { toString(): string }).toString() },
              },
              {
                userId: targetUserId,
                type: 'match',
                title: 'New Match',
                body: 'You have a new match. Say hello.',
                data: { matchId: (match._id as { toString(): string }).toString() },
              },
            ]);
          }

          isMatch = true;
          matchId = (match._id as { toString(): string }).toString();
        }
      }

      res.json({ isMatch, matchId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

// ─── POST /api/discover/compliment ───────────────────────────────────────────
discoverRouter.post(
  '/compliment',
  requireUser,
  requireVerified,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { targetUserId, mode, text } = req.body as {
        targetUserId: string;
        mode: string;
        text?: string;
      };

      if (!text?.trim()) {
        res.status(400).json({ message: 'Compliment text is required' });
        return;
      }

      await checkAndResetLimits(req.userId);
      const user = await User.findById(req.userId).select('complimentsUsedToday');
      if (!user || user.complimentsUsedToday >= DAILY_COMPLIMENTS) {
        res.status(429).json({ message: 'Daily compliment limit reached' });
        return;
      }

      const swipe = await Swipe.findOneAndUpdate(
        { fromUserId: req.userId, toUserId: targetUserId, mode },
        { action: 'like', compliment: text.trim() },
        { upsert: true, new: true }
      );

      await User.findByIdAndUpdate(req.userId, {
        $inc: { likesUsedToday: 1, complimentsUsedToday: 1 },
      });

      res.json(swipe);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);