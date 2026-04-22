// src/services/endpoints.ts — Thin wrappers around backend routes.

import type {
  AppNotification,
  DailyLimits,
  DiscoverFilters,
  DiscoverResponse,
  FullUser,
  LocalPhoto,
  Match,
  MatchingMode,
  Message,
  MessagesResponse,
  Photo,
  SwipeResponse,
  UserProfile,
} from '@/src/types';
import { api } from './api';

/* ─── Profile ─────────────────────────────────────────────────────────── */

export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const { data } = await api.get<UserProfile>('/api/profile/me');
    return data;
  } catch (e) {
    const err = e as { status?: number };
    // 404 → profile genuinely doesn't exist yet (new user, mid-onboarding)
    if (err.status === 404) return null;
    // All other errors (401, 5xx, network) must propagate so React Query
    // can retry and the router can show the correct error state — not
    // silently redirect to onboarding.
    throw e;
  }
}

export interface CreateProfilePayload {
  fullName: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  city: string;
  country: string;
  religion: string;
  photos: LocalPhoto[];
  interests: string[];
  lookingFor: MatchingMode[];
  bio?: string;
  occupation?: string;
  height?: number | null;
  educationLevel?: string | null;
  smoking?: string | null;
  drinking?: string | null;
  wantKids?: string | null;
  personality?: string | null;
  email?: string;
}

/**
 * Creates the user profile in a single atomic operation:
 * 1. Uploads each local photo file as multipart to the backend → Cloudinary
 * 2. POSTs the full profile JSON (including the returned Cloudinary photo objects)
 *
 * This is the ONLY place photos are uploaded — never during onboarding steps.
 */
export async function createProfile(
  payload: CreateProfilePayload
): Promise<UserProfile> {
  // Step 1: upload all local photos sequentially to /api/profile/photos/upload
  const uploadedPhotos: Photo[] = [];

  for (const localPhoto of payload.photos) {
    const uploaded = await uploadPhotoFile(localPhoto.localUri);
    uploadedPhotos.push({
      cloudinaryUrl: uploaded.cloudinaryUrl,
      cloudinaryPublicId: uploaded.cloudinaryPublicId,
      isMain: localPhoto.isMain,
      order: localPhoto.order,
    });
  }

  // Step 2: create the profile with the resolved Cloudinary photo objects
  const { data } = await api.post<UserProfile>('/api/profile', {
    fullName: payload.fullName,
    gender: payload.gender,
    dateOfBirth: payload.dateOfBirth,
    city: payload.city,
    country: payload.country,
    religion: payload.religion,
    photos: uploadedPhotos,
    interests: payload.interests,
    lookingFor: payload.lookingFor,
    bio: payload.bio,
    occupation: payload.occupation,
    height: payload.height,
    educationLevel: payload.educationLevel,
    smoking: payload.smoking,
    drinking: payload.drinking,
    wantKids: payload.wantKids,
    personality: payload.personality,
    email: payload.email,
  });

  return data;
}

export async function updateProfile(
  patch: Partial<UserProfile>
): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/api/profile/me', patch);
  return data;
}

export async function deleteMyAccount(): Promise<void> {
  await api.delete('/api/profile/me');
}

/**
 * Uploads a single local image URI to the backend (which relays to Cloudinary).
 * Used internally by createProfile. Also exported for post-onboarding photo
 * management (e.g., profile edit screen).
 */
export async function uploadPhotoFile(
  localUri: string
): Promise<{ cloudinaryUrl: string; cloudinaryPublicId: string }> {
  const filename = localUri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const form = new FormData();
  form.append('photo', {
    uri: localUri,
    name: filename,
    type: mime,
  } as unknown as Blob);

  // Do NOT set Content-Type manually — the axios interceptor in api.ts
  // deletes it for FormData so the runtime sets the correct multipart boundary.
  const { data } = await api.post<{
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
  }>('/api/profile/photos/upload', form);

  return data;
}

/** Kept for backward-compat on the profile edit screen (already uploaded photos). */
export async function uploadPhoto(
  localUri: string
): Promise<{ cloudinaryUrl: string; cloudinaryPublicId: string }> {
  return uploadPhotoFile(localUri);
}

export async function deletePhoto(publicId: string): Promise<void> {
  await api.delete(`/api/profile/photos/${encodeURIComponent(publicId)}`);
}

export async function submitVerification(selfieUrl: string): Promise<void> {
  await api.post('/api/profile/verify', { selfieUrl });
}

/* ─── Discovery ───────────────────────────────────────────────────────── */

export async function getDiscoverFeed(
  mode: MatchingMode,
  filters: DiscoverFilters,
  page = 1
): Promise<DiscoverResponse> {
  const { data } = await api.get<DiscoverResponse>(`/api/discover/${mode}`, {
    params: {
      page,
      ageMin: filters.ageMin,
      ageMax: filters.ageMax,
      sameCity: filters.sameCity ? 'true' : 'false',
    },
  });
  return data;
}

export async function swipe(
  targetUserId: string,
  action: 'like' | 'pass',
  mode: MatchingMode,
  compliment?: string
): Promise<SwipeResponse> {
  const { data } = await api.post<SwipeResponse>('/api/discover/swipe', {
    targetUserId,
    action,
    mode,
    compliment,
  });
  return data;
}

export async function sendCompliment(
  targetUserId: string,
  mode: MatchingMode,
  text: string
): Promise<void> {
  await api.post('/api/discover/compliment', { targetUserId, mode, text });
}

export async function getDailyLimits(): Promise<DailyLimits> {
  const { data } = await api.get<DailyLimits>('/api/discover/limits');
  return data;
}

/* ─── Matches ─────────────────────────────────────────────────────────── */

export async function getMatches(): Promise<Match[]> {
  const { data } = await api.get<Match[]>('/api/matches');
  return data;
}

export async function unmatch(matchId: string): Promise<void> {
  await api.delete(`/api/matches/${matchId}`);
}

/* ─── Messages ────────────────────────────────────────────────────────── */

export async function getMessages(
  matchId: string,
  page = 1
): Promise<MessagesResponse> {
  const { data } = await api.get<MessagesResponse>(`/api/messages/${matchId}`, {
    params: { page },
  });
  return data;
}

export async function sendMessage(
  matchId: string,
  content: string
): Promise<Message> {
  const { data } = await api.post<Message>(`/api/messages/${matchId}`, {
    content,
  });
  return data;
}

export async function markMessagesRead(matchId: string): Promise<void> {
  await api.patch(`/api/messages/${matchId}/read`);
}

/* ─── Users ───────────────────────────────────────────────────────────── */

export async function getUserById(userId: string): Promise<FullUser> {
  const { data } = await api.get<FullUser>(`/api/users/${userId}`);
  return data;
}

/* ─── Safety ──────────────────────────────────────────────────────────── */

export async function reportUser(
  reportedUserId: string,
  reason: string,
  details?: string
): Promise<void> {
  await api.post('/api/safety/report', { reportedUserId, reason, details });
}

export async function blockUser(blockedUserId: string): Promise<void> {
  await api.post('/api/safety/block', { blockedUserId });
}

export async function unblockUser(blockedUserId: string): Promise<void> {
  await api.delete(`/api/safety/block/${blockedUserId}`);
}

export async function getBlockedUsers(): Promise<string[]> {
  const { data } = await api.get<string[]>('/api/safety/blocked');
  return data;
}

/* ─── Notifications ───────────────────────────────────────────────────── */

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>('/api/notifications');
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/api/notifications/read-all');
}

export async function registerPushToken(
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  await api.post('/api/notifications/push-token', { token, platform });
}

/* ─── Type re-exports ─────────────────────────────────────────────────── */
export type { LocalPhoto, Photo };
