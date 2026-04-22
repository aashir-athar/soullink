// backend/src/models/index.ts — All Mongoose models for Soullink
// Updated: 2026-04-17 | Mongoose 9.x

import mongoose, { Schema, type Document, model } from 'mongoose';

// ─── USER MODEL ───────────────────────────────────────────────────────────────
export interface IUser extends Document {
  clerkId: string;
  email: string;
  fullName: string;
  gender: 'male' | 'female';
  dateOfBirth: Date;
  age: number;
  city: string;
  country: string;
  religion: string;
  photos: {
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    isMain: boolean;
    order: number;
  }[];
  interests: string[];
  lookingFor: string[];
  bio?: string;
  occupation?: string;
  height?: number;
  educationLevel?: string;
  smoking?: string;
  drinking?: string;
  wantKids?: string;
  personality?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  selfieUrl?: string;
  profileStatus: 'active' | 'paused' | 'deleted';
  blockedUsers: string[];
  likesUsedToday: number;
  complimentsUsedToday: number;
  lastLimitReset: Date;
  pushToken?: string;
  pushPlatform?: 'ios' | 'android';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true, min: 18 },
    city: { type: String, required: true },
    country: { type: String, required: true },
    religion: { type: String, required: true, default: 'prefer_not_to_say' },
    photos: [
      {
        cloudinaryUrl: { type: String, required: true },
        cloudinaryPublicId: { type: String, required: true },
        isMain: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    interests: [{ type: String }],
    lookingFor: [{ type: String }],
    bio: { type: String, maxlength: 500 },
    occupation: { type: String, maxlength: 100 },
    height: { type: Number, min: 100, max: 250 },
    educationLevel: { type: String },
    smoking: { type: String },
    drinking: { type: String },
    wantKids: { type: String },
    personality: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'not_submitted'],
      default: 'not_submitted',
    },
    selfieUrl: { type: String },
    profileStatus: {
      type: String,
      enum: ['active', 'paused', 'deleted'],
      default: 'active',
    },
    blockedUsers: [{ type: String }],
    likesUsedToday: { type: Number, default: 0 },
    complimentsUsedToday: { type: Number, default: 0 },
    lastLimitReset: { type: Date, default: Date.now },
    pushToken: { type: String },
    pushPlatform: { type: String, enum: ['ios', 'android'] },
  },
  {
    timestamps: true,
    // Mongoose 9: optimisticConcurrency is available for update conflict safety
    optimisticConcurrency: true,
  }
);

// Compound indexes for discovery queries
UserSchema.index({ city: 1, gender: 1, verificationStatus: 1, profileStatus: 1 });
UserSchema.index({ religion: 1, gender: 1 });
UserSchema.index({ age: 1 });

export const User = model<IUser>('User', UserSchema);

// ─── SWIPE MODEL ─────────────────────────────────────────────────────────────
export interface ISwipe extends Document {
  fromUserId: string;
  toUserId: string;
  action: 'like' | 'pass';
  mode: string;
  compliment?: string;
  createdAt: Date;
}

const SwipeSchema = new Schema<ISwipe>(
  {
    fromUserId: { type: String, required: true, index: true },
    toUserId: { type: String, required: true, index: true },
    action: { type: String, enum: ['like', 'pass'], required: true },
    mode: { type: String, required: true },
    compliment: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

SwipeSchema.index({ fromUserId: 1, toUserId: 1, mode: 1 }, { unique: true });

export const Swipe = model<ISwipe>('Swipe', SwipeSchema);

// ─── MATCH MODEL ─────────────────────────────────────────────────────────────
export interface IMatch extends Document {
  users: [string, string];
  mode: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    users: {
      type: [String],
      required: true,
      validate: [
        (v: string[]) => v.length === 2,
        'Match must have exactly 2 users',
      ],
    },
    mode: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MatchSchema.index({ users: 1 });
MatchSchema.index({ 'users.0': 1, 'users.1': 1, mode: 1 }, { unique: true });

export const Match = model<IMatch>('Match', MatchSchema);

// ─── MESSAGE MODEL ────────────────────────────────────────────────────────────
export interface IMessage extends Document {
  matchId: string;
  senderId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    matchId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

MessageSchema.index({ matchId: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', MessageSchema);

// ─── REPORT MODEL ─────────────────────────────────────────────────────────────
export interface IReport extends Document {
  reporterUserId: string;
  reportedUserId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'actioned';
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterUserId: { type: String, required: true },
    reportedUserId: { type: String, required: true },
    reason: { type: String, required: true },
    details: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'actioned'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const Report = model<IReport>('Report', ReportSchema);

// ─── NOTIFICATION MODEL ───────────────────────────────────────────────────────
export interface INotification extends Document {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = model<INotification>(
  'Notification',
  NotificationSchema
);
