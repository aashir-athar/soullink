// backend/src/middleware/auth.ts — Clerk authentication middleware
// @clerk/express 2.x: uses clerkMiddleware + getAuth (correct pattern for v2)
// clerkMiddleware handles session tokens, JWTs, and JWKS caching correctly.

import type { Request, Response, NextFunction } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { User } from '../models/index.js';

// Extend Request to carry verified user data downstream
declare global {
  namespace Express {
    interface Request {
      clerkId: string;
      userId: string; // MongoDB User _id as string
    }
  }
}

/**
 * Global Clerk middleware — mounted once in index.ts before all routes.
 * Verifies the Bearer token (session token or JWT), populates req.auth(),
 * and handles JWKS fetching/caching automatically.
 */
export const clerkAuth = clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY || "sk_test_nbtBzzr9gyPxZmeRvxtHgysVqe8tJCTm3yfYyhaNzt",
});

/**
 * Route-level middleware: reads the verified Clerk identity from req.auth(),
 * attaches req.clerkId, and (if a User doc exists) attaches req.userId.
 * Must come after clerkMiddleware in the chain.
 */
export async function attachUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      res.status(401).json({ message: 'No authorization token provided' });
      return;
    }

    req.clerkId = auth.userId;

    // Look up the MongoDB User document (may not exist yet during onboarding)
    const user = await User.findOne({ clerkId: auth.userId })
      .select('_id')
      .lean();
    if (user) {
      req.userId = (user._id as { toString(): string }).toString();
    }

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Route-level middleware: requires a User document to exist (post-onboarding).
 * Must come after attachUser in the chain.
 */
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.userId) {
    res.status(404).json({
      message: 'User profile not found. Please complete onboarding.',
    });
    return;
  }
  next();
}

/**
 * Route-level middleware: requires the user's profile to be verified.
 */
export async function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await User.findById(req.userId)
    .select('verificationStatus')
    .lean();
  if (!user || user.verificationStatus !== 'approved') {
    res.status(403).json({
      message:
        'Profile verification required. Please complete the verification process.',
    });
    return;
  }
  next();
}