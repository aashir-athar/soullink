// backend/src/index.ts — Soullink Express 5 + Socket.io server

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { clerkMiddleware } from '@clerk/express';
import { v2 as cloudinary } from 'cloudinary';

import { profileRouter } from './routes/profile.js';
import { discoverRouter } from './routes/discover.js';
import { matchesRouter } from './routes/matches.js';
import { messagesRouter } from './routes/messages.js';
import { safetyRouter } from './routes/safety.js';
import { notificationsRouter } from './routes/notifications.js';
import { usersRouter } from './routes/users.js';
import { attachUser } from './middleware/auth.js';
import { registerSocketHandlers } from './socket.js';
import { logger } from './services/logger.js';

// ─── FIX 1: Load .env from the project root (where Railway runs from) ─────────
// dotenv.config() with no path loads from process.cwd() = project root.
// Previously the .env.local was inside src/ so Railway never loaded it.
config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const httpServer = createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

registerSocketHandlers(io);

// ─── FIX 2: CORS — must be first middleware before any route ──────────────────
// Was removed "for testing" but never restored. Without this, all cross-origin
// requests from Expo Go on a physical device are blocked by the runtime.
const allowedOrigins = process.env['ALLOWED_ORIGINS']
  ? process.env['ALLOWED_ORIGINS'].split(',').map((o) => o.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  })
);

// ─── FIX 3: Body parsers — express.json() was never registered ───────────────
// Without this, req.body is always undefined on every POST/PATCH route.
// Profile creation was failing with 400 "Missing required fields" because
// fullName, gender, etc. were all undefined even when sent correctly.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Standard middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('combined'));

// ─── Clerk: verify token and populate req.auth() on every request ─────────────
// clerkMiddleware must run before any route that calls getAuth() or attachUser().
const clerkOptions = {
  ...(process.env.CLERK_SECRET_KEY && { secretKey: process.env.CLERK_SECRET_KEY }),
  ...(process.env.CLERK_PUBLISHABLE_KEY && {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }),
};
app.use(clerkMiddleware(clerkOptions));

// ─── Cloudinary ───────────────────────────────────────────────────────────────
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

// ─── Health check (no auth required) ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'] ?? 'development',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── Routes (attachUser resolves clerkId + userId from req.auth()) ────────────
app.use('/api/profile', attachUser, profileRouter);
app.use('/api/discover', attachUser, discoverRouter);
app.use('/api/matches', attachUser, matchesRouter);
app.use('/api/messages', attachUser, messagesRouter);
app.use('/api/safety', attachUser, safetyRouter);
app.use('/api/notifications', attachUser, notificationsRouter);
app.use('/api/users', attachUser, usersRouter);

// ─── Global error handler (Express 5) ────────────────────────────────────────
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error(err);
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status: number }).status
        : 500;
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    res.status(status).json({ message });
  }
);

// ─── DB + Start ───────────────────────────────────────────────────────────────
const PORT = process.env['PORT'] ?? 3000;

// MONGO_URI must be set in Railway environment variables (or .env at project root).
// No hardcoded fallback — fail loudly if missing so Railway logs show the real problem.
const MONGO_URI = process.env['MONGODB_URI'];
if (!MONGO_URI) {
  logger.error(
    'MONGODB_URI environment variable is not set. ' +
    'Set it in Railway → Variables, or in a .env file at the project root.'
  );
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    dbName: 'soullink',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    autoIndex: process.env['NODE_ENV'] !== 'production',
  })
  .then(() => {
    logger.info('MongoDB connected');
    httpServer.listen(PORT, () => {
      logger.info(`Soullink API running on port ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    logger.error('MongoDB connection failed:', err);
    process.exit(1);
  });

export { io };