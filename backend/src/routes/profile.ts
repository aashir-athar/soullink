// backend/src/routes/profile.ts — Profile management routes
// Express 5, multer 2.x, Cloudinary 2.9, @clerk/express 2.x

import { Router, type Request, type Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { differenceInYears } from 'date-fns';
import { User } from '../models/index.js';
import { requireUser } from '../middleware/auth.js';
import { logger } from '../services/logger.js';

export const profileRouter = Router();

// Configure Cloudinary exclusively from environment variables — no hardcoded fallbacks.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (
  !process.env['CLOUDINARY_CLOUD_NAME'] ||
  !process.env['CLOUDINARY_API_KEY'] ||
  !process.env['CLOUDINARY_API_SECRET']
) {
  logger.warn('[Soullink] Cloudinary env vars missing — photo uploads will fail.');
}

// Multer: memoryStorage, 10 MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ─── Helper: upload a buffer to Cloudinary ────────────────────────────────────
async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 1067, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
        } else {
          resolve(result as { secure_url: string; public_id: string });
        }
      }
    );
    stream.end(buffer);
  });
}

// ─── GET /api/profile/me ──────────────────────────────────────────────────────
profileRouter.get(
  '/me',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.userId).lean();
      if (!user) {
        res.status(404).json({ message: 'Profile not found' });
        return;
      }
      res.json(user);
    } catch (err: unknown) {
      logger.error(err);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  }
);

// ─── POST /api/profile — Create profile after onboarding ─────────────────────
profileRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.clerkId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const {
      fullName,
      gender,
      dateOfBirth,
      city,
      country,
      religion,
      interests,
      lookingFor,
      bio,
      occupation,
      height,
      educationLevel,
      smoking,
      drinking,
      wantKids,
      personality,
      photos,
      email,
    } = req.body as Record<string, unknown>;

    if (!fullName || !gender || !dateOfBirth || !city || !country) {
      res.status(400).json({
        message: 'Missing required fields: fullName, gender, dateOfBirth, city, country',
      });
      return;
    }

    if (gender !== 'male' && gender !== 'female') {
      res.status(400).json({ message: 'gender must be "male" or "female"' });
      return;
    }

    const dob = new Date(dateOfBirth as string);
    if (isNaN(dob.getTime())) {
      res.status(400).json({ message: 'Invalid dateOfBirth format' });
      return;
    }
    const age = differenceInYears(new Date(), dob);
    if (age < 18) {
      res.status(400).json({ message: 'You must be 18 or older to use Soullink' });
      return;
    }

    const photoArray = Array.isArray(photos) ? photos : [];
    if (photoArray.length < 3) {
      res.status(400).json({ message: 'At least 3 photos are required' });
      return;
    }

    // Idempotency: if profile already exists return it
    const existing = await User.findOne({ clerkId: req.clerkId });
    if (existing) {
      res.status(200).json(existing);
      return;
    }

    const user = await User.create({
      clerkId: req.clerkId,
      email: (email as string) ?? `${req.clerkId}@soullink.app`,
      fullName,
      gender,
      dateOfBirth: dob,
      age,
      city,
      country,
      religion: (religion as string) ?? 'prefer_not_to_say',
      interests: Array.isArray(interests) ? interests : [],
      lookingFor: Array.isArray(lookingFor) ? lookingFor : [],
      photos: photoArray,
      bio: (bio as string) ?? '',
      occupation: (occupation as string) ?? '',
      height: (height as number) ?? undefined,
      educationLevel: (educationLevel as string) ?? undefined,
      smoking: (smoking as string) ?? undefined,
      drinking: (drinking as string) ?? undefined,
      wantKids: (wantKids as string) ?? undefined,
      personality: (personality as string) ?? undefined,
      verificationStatus: 'not_submitted',
      profileStatus: 'active',
    });

    res.status(201).json(user);
  } catch (err: unknown) {
    logger.error(err);
    const message =
      err instanceof Error ? err.message : 'Failed to create profile';
    res.status(500).json({ message });
  }
});

// ─── PATCH /api/profile/me ────────────────────────────────────────────────────
profileRouter.patch(
  '/me',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const allowedFields = [
        'fullName', 'city', 'country', 'religion', 'interests', 'lookingFor',
        'bio', 'occupation', 'height', 'educationLevel', 'smoking', 'drinking',
        'wantKids', 'personality',
      ];
      const updates: Record<string, unknown> = {};
      const body = req.body as Record<string, unknown>;
      for (const field of allowedFields) {
        if (body[field] !== undefined) updates[field] = body[field];
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

// ─── DELETE /api/profile/me ───────────────────────────────────────────────────
profileRouter.delete(
  '/me',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      for (const photo of user.photos) {
        try {
          await cloudinary.uploader.destroy(photo.cloudinaryPublicId);
        } catch { /* best-effort */ }
      }
      await User.findByIdAndDelete(req.userId);
      res.status(204).send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

// ─── POST /api/profile/photos/upload — Upload photo (pre- or post-profile) ────
// Does NOT require an existing User doc — valid Clerk token is sufficient.
// Used during onboarding before the User document exists.
profileRouter.post(
  '/photos/upload',
  upload.single('photo'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.clerkId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ message: 'No photo file provided' });
        return;
      }
      const folder = `soullink/profiles/${req.clerkId}`;
      const result = await uploadBufferToCloudinary(req.file.buffer, folder);
      res.json({
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
      });
    } catch (err: unknown) {
      logger.error(err);
      const message = err instanceof Error ? err.message : 'Photo upload failed';
      res.status(500).json({ message });
    }
  }
);

// ─── POST /api/profile/photos — Add photo to existing profile ─────────────────
profileRouter.post(
  '/photos',
  requireUser,
  upload.single('photo'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No photo file provided' });
        return;
      }
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      if (user.photos.length >= 5) {
        res.status(400).json({ message: 'Maximum 5 photos allowed' });
        return;
      }
      const folder = `soullink/profiles/${req.userId}`;
      const result = await uploadBufferToCloudinary(req.file.buffer, folder);

      const newPhoto = {
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        isMain: user.photos.length === 0,
        order: user.photos.length,
      };
      await User.findByIdAndUpdate(req.userId, { $push: { photos: newPhoto } });
      res.json({
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
      });
    } catch (err: unknown) {
      logger.error(err);
      const message = err instanceof Error ? err.message : 'Photo upload failed';
      res.status(500).json({ message });
    }
  }
);

// ─── DELETE /api/profile/photos/:publicId ────────────────────────────────────
profileRouter.delete(
  '/photos/:publicId',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const publicId = decodeURIComponent(req.params['publicId']!);
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        logger.error('Cloudinary destroy failed:', cloudErr);
      }
      await User.findByIdAndUpdate(req.userId, {
        $pull: { photos: { cloudinaryPublicId: publicId } },
      });
      res.status(204).send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

// ─── POST /api/profile/verify ────────────────────────────────────────────────
profileRouter.post(
  '/verify',
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { selfieUrl } = req.body as { selfieUrl?: string };
      if (!selfieUrl) {
        res.status(400).json({ message: 'Selfie URL required' });
        return;
      }
      await User.findByIdAndUpdate(req.userId, {
        $set: { selfieUrl, verificationStatus: 'pending' },
      });
      res.json({
        message: 'Verification submitted. Review typically completes within 24 hours.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

// ─── GET /api/profile/admin/pending ──────────────────────────────────────────
// Returns all users with verificationStatus === 'pending' so you can review
// their selfieUrl alongside their profile photos.
// Protected by x-admin-key header (set ADMIN_SECRET_KEY in your .env).
profileRouter.get(
  '/admin/pending',
  async (req: Request, res: Response): Promise<void> => {
    const adminKey = process.env['ADMIN_SECRET_KEY'];
    if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    try {
      const users = await User.find({ verificationStatus: 'pending' })
        .select('_id fullName selfieUrl photos createdAt')
        .lean();
      res.json(users);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);

// ─── PATCH /api/profile/admin/verify/:userId ─────────────────────────────────
// Approves or rejects a user's selfie verification.
//
// Who calls this: YOU (the operator), via curl / Postman / an internal admin
// panel — never from the public app. Protect it with a strong ADMIN_SECRET_KEY
// env var and do NOT expose this route to end users.
//
// Request headers:  x-admin-key: <ADMIN_SECRET_KEY>
// Request body:     { "decision": "approved" | "rejected" }
//
// Example:
//   curl -X PATCH https://your-api.com/api/profile/admin/verify/<userId> \
//     -H "x-admin-key: $ADMIN_SECRET_KEY" \
//     -H "Content-Type: application/json" \
//     -d '{"decision":"approved"}'
profileRouter.patch(
  '/admin/verify/:userId',
  async (req: Request, res: Response): Promise<void> => {
    const adminKey = process.env['ADMIN_SECRET_KEY'];
    if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    try {
      const { decision } = req.body as { decision?: string };
      if (decision !== 'approved' && decision !== 'rejected') {
        res.status(400).json({ message: 'decision must be "approved" or "rejected"' });
        return;
      }
      const user = await User.findByIdAndUpdate(
        req.params['userId'],
        { $set: { verificationStatus: decision } },
        { new: true }
      ).select('_id fullName verificationStatus');

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      logger.info(`[Admin] Verification ${decision} for user ${user._id} (${user.fullName})`);
      res.json({ userId: user._id, fullName: user.fullName, verificationStatus: user.verificationStatus });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ message });
    }
  }
);