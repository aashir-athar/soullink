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
import { clerkMiddleware } from "@clerk/express";
import { v2 as cloudinary } from 'cloudinary';

import { profileRouter } from './routes/profile.js';
import { discoverRouter } from './routes/discover.js';
import { matchesRouter } from './routes/matches.js';
import { messagesRouter } from './routes/messages.js';
import { safetyRouter } from './routes/safety.js';
import { notificationsRouter } from './routes/notifications.js';
import { usersRouter } from './routes/users.js';
import { clerkAuth, attachUser } from './middleware/auth.js';
import { registerSocketHandlers } from './socket.js';
import { logger } from './services/logger.js';

config();

const app = express();
const httpServer = createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? ['*'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

registerSocketHandlers(io);

// ─── CORS config ─────────────────────────────────────────────────────────────
const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') ?? [];

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ─── Core middleware ──────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } })
);

// ─── Clerk: verify token and populate req.auth() on every request ─────────────
// clerkMiddleware must run before any route that calls getAuth() or attachUser().
const clerkOptions = {
  ...(process.env.CLERK_SECRET_KEY && { secretKey: process.env.CLERK_SECRET_KEY }),
  ...(process.env.CLERK_PUBLISHABLE_KEY && { publishableKey: process.env.CLERK_PUBLISHABLE_KEY }),
};
app.use(clerkMiddleware(clerkOptions));

// Configure Cloudinary exclusively from environment variables — no hardcoded fallbacks.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Health check (no auth required) ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'] ?? 'development',
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
const MONGO_URI =
  process.env['MONGODB_URI'] ?? 'mongodb+srv://aashirathar_db_user:llAbiShir3298ll@soullinkcluster.i2vjbn2.mongodb.net/soullink?retryWrites=true&w=majority&appName=soullinkCluster';

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