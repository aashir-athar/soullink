// src/types/index.ts — Shared TypeScript types for Soullink
// Mirrors the backend Mongoose models + API response shapes.

export type Gender = 'male' | 'female';

export type MatchingMode = 'friendship' | 'relationship' | 'marriage';

export type Religion =
  | 'islam'
  | 'christianity'
  | 'hinduism'
  | 'sikhism'
  | 'buddhism'
  | 'judaism'
  | 'other'
  | 'prefer_not_to_say';

export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'approved'
  | 'rejected';

export type ProfileStatus = 'active' | 'paused' | 'deleted';

export type EducationLevel =
  | 'high_school'
  | 'bachelors'
  | 'masters'
  | 'doctorate'
  | 'other';

export type YesNoMaybe = 'yes' | 'no' | 'maybe';

export type YesNoSometimes = 'yes' | 'no' | 'sometimes';

export type Personality = 'introvert' | 'extrovert' | 'ambivert';

// Fully-uploaded photo stored in MongoDB / returned by API
export interface Photo {
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  isMain: boolean;
  order: number;
}

// Photo stored locally during onboarding — only uploaded on profile creation
export interface LocalPhoto {
  localUri: string;
  isMain: boolean;
  order: number;
}

export interface UserProfile {
  _id: string;
  clerkId: string;
  email: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string; // ISO date
  age: number;
  city: string;
  country: string;
  religion: Religion;
  photos: Photo[];
  interests: string[];
  lookingFor: MatchingMode[];
  bio?: string;
  occupation?: string;
  height?: number;
  educationLevel?: EducationLevel;
  smoking?: YesNoSometimes;
  drinking?: YesNoSometimes;
  wantKids?: YesNoMaybe;
  personality?: Personality;
  verificationStatus: VerificationStatus;
  selfieUrl?: string;
  profileStatus: ProfileStatus;
  blockedUsers: string[];
  likesUsedToday: number;
  complimentsUsedToday: number;
  lastLimitReset: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoverProfile {
  userId: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  gender: Gender;
  religion: Religion;
  mainPhoto: string;
  photoCount: number;
  interests: string[];
  bio?: string;
  compatibilityScore: number;
  mode: MatchingMode;
}

export interface FullUser extends DiscoverProfile {
  photos: string[];
  occupation?: string;
}

export interface Match {
  _id: string;
  users: [string, string];
  mode: MatchingMode;
  createdAt: string;
  otherUser: DiscoverProfile;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface Message {
  _id: string;
  matchId: string;
  senderId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  type: 'match' | 'message' | 'like' | 'compliment' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface DailyLimits {
  likesUsed: number;
  likesLimit: number;
  complimentsUsed: number;
  complimentsLimit: number;
  resetTime: string;
}

export interface SwipeResponse {
  isMatch: boolean;
  matchId?: string;
}

export interface DiscoverResponse {
  profiles: DiscoverProfile[];
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface DiscoverFilters {
  ageMin: number;
  ageMax: number;
  sameCity: boolean;
}

/* ─── Onboarding draft (kept in Zustand until POST /profile) ───────────── */
export interface OnboardingDraft {
  fullName: string;
  gender: Gender | null;
  dateOfBirth: string | null;
  city: string;
  country: string;
  religion: Religion;
  // Local photos only — never uploaded until profile creation in step-6
  photos: LocalPhoto[];
  interests: string[];
  lookingFor: MatchingMode[];
  bio: string;
  occupation: string;
  height: number | null;
  educationLevel: EducationLevel | null;
  smoking: YesNoSometimes | null;
  drinking: YesNoSometimes | null;
  wantKids: YesNoMaybe | null;
  personality: Personality | null;
}