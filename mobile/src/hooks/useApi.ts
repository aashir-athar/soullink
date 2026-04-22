// src/hooks/useApi.ts — React Query hooks organised by resource.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import * as api from '@/src/services/endPoints';
import type {
  DiscoverFilters,
  MatchingMode,
  Message,
  UserProfile,
} from '@/src/types';

/* ─── Query keys ──────────────────────────────────────────────────────────── */

export const qk = {
  profile: ['profile', 'me'] as const,
  limits: ['discover', 'limits'] as const,
  discover: (mode: MatchingMode, filters: DiscoverFilters) =>
    ['discover', mode, filters] as const,
  matches: ['matches'] as const,
  messages: (matchId: string) => ['messages', matchId] as const,
  user: (userId: string) => ['user', userId] as const,
  notifications: ['notifications'] as const,
  blocked: ['blocked'] as const,
};

/* ─── Profile ─────────────────────────────────────────────────────────────── */

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: qk.profile,
    queryFn: api.getMyProfile,
    staleTime: 0,
    enabled,
    retry: (failureCount, error) => {
      const status = (error as { status?: number })?.status;
      // 404 = no profile yet — valid terminal state, never retry
      if (status === 404) return false;
      // 401 = token not ready yet on cold-start; retry up to 6 times
      if (status === 401) return failureCount < 6;
      // Network / 5xx errors: retry up to 4 times
      return failureCount < 4;
    },
    retryDelay: (attempt, error) => {
      const status = (error as { status?: number })?.status;
      // For 401 (token not ready), exponential backoff: 300 → 600 → 1200 → 2000ms cap
      if (status === 401) return Math.min(300 * Math.pow(2, attempt), 2000);
      // Network / 5xx: linear 1s delay between retries
      return 1000;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (data) => {
      qc.setQueryData(qk.profile, data);
    },
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createProfile,
    onSuccess: (data) => {
      qc.setQueryData(qk.profile, data);
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteMyAccount,
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.submitVerification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile });
    },
  });
}

/* ─── Discovery ───────────────────────────────────────────────────────────── */

export function useDiscoverFeed(mode: MatchingMode, filters: DiscoverFilters) {
  return useInfiniteQuery({
    queryKey: qk.discover(mode, filters),
    queryFn: ({ pageParam = 1 }) => api.getDiscoverFeed(mode, filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    staleTime: 1000 * 30,
  });
}

export function useDailyLimits() {
  return useQuery({
    queryKey: qk.limits,
    queryFn: api.getDailyLimits,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

export function useSwipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetUserId,
      action,
      mode,
      compliment,
    }: {
      targetUserId: string;
      action: 'like' | 'pass';
      mode: MatchingMode;
      compliment?: string;
    }) => api.swipe(targetUserId, action, mode, compliment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.limits });
      qc.invalidateQueries({ queryKey: qk.matches });
    },
  });
}

/* ─── Matches ─────────────────────────────────────────────────────────────── */

export function useMatches() {
  return useQuery({
    queryKey: qk.matches,
    queryFn: api.getMatches,
    staleTime: 1000 * 30,
  });
}

export function useUnmatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.unmatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.matches });
    },
  });
}

/* ─── Messages ────────────────────────────────────────────────────────────── */

export function useMessages(matchId: string) {
  return useQuery({
    queryKey: qk.messages(matchId),
    queryFn: () => api.getMessages(matchId, 1),
    enabled: !!matchId,
    staleTime: 1000 * 15,
  });
}

export function useSendMessage(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.sendMessage(matchId, content),
    onSuccess: (newMsg) => {
      const key = qk.messages(matchId);
      const prev = qc.getQueryData<{ messages: Message[]; hasMore: boolean }>(key);
      if (prev) {
        qc.setQueryData(key, {
          ...prev,
          messages: [...prev.messages, newMsg],
        });
      }
      qc.invalidateQueries({ queryKey: qk.matches });
    },
  });
}

export function useMarkMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markMessagesRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.matches });
    },
  });
}

/* ─── Users ───────────────────────────────────────────────────────────────── */

export function useUser(userId: string) {
  return useQuery({
    queryKey: qk.user(userId),
    queryFn: () => api.getUserById(userId),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

/* ─── Safety ──────────────────────────────────────────────────────────────── */

export function useReportUser() {
  return useMutation({
    mutationFn: ({
      userId,
      reason,
      details,
    }: {
      userId: string;
      reason: string;
      details?: string;
    }) => api.reportUser(userId, reason, details),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.blockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.matches });
      qc.invalidateQueries({ queryKey: qk.blocked });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.unblockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.blocked });
    },
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: qk.blocked,
    queryFn: api.getBlockedUsers,
    staleTime: 1000 * 60,
  });
}

/* ─── Notifications ───────────────────────────────────────────────────────── */

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: api.getNotifications,
    staleTime: 1000 * 30,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
    },
  });
}

/* ─── Photo upload (post-onboarding, e.g. profile edit) ─────────────────── */

export function useUploadPhoto() {
  return useMutation({
    mutationFn: api.uploadPhoto,
  });
}

export function invalidateProfile(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: qk.profile });
}

export type { UserProfile };
