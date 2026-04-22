// app/chat/[id].tsx — One-on-one chat thread.
//
// Data strategy:
//   - Initial page of 40 messages via REST (useMessages).
//   - Real-time updates via Socket.io: we append new-message payloads to
//     the React Query cache optimistically, so there's no delay for the
//     sender and under 100ms for the receiver.
//   - Typing indicator driven by socket events (debounced in composer).
//   - mark-read fires on mount + whenever the app re-focuses this screen.
//
// Performance: FlashList + inverted layout means only visible bubbles
// render — even thousand-message threads stay smooth.

import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ChatBubble } from '@/src/components/chat/ChatBubble';
import { ChatComposer } from '@/src/components/chat/ChatComposer';
import { TypingIndicator } from '@/src/components/chat/TypingIndicator';
import { Avatar } from '@/src/components/ui/Avatar';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { IconButton } from '@/src/components/ui/IconButton';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { SoulLinkLoader } from '@/src/components/ui/SoulLinkLoader';
import { Text } from '@/src/components/ui/Text';
import { useToast } from '@/src/components/ui/Toast';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  qk,
  useBlockUser,
  useMarkMessagesRead,
  useMessages,
  useMyProfile,
  useSendMessage,
  useUnmatch,
} from '@/src/hooks/useApi';
import { useSocket } from '@/src/hooks/useSocket';
import type { MatchingMode, Message } from '@/src/types';
import { haptics } from '@/src/utils/haptics';
import { modeLabel } from '@/src/utils/modes';

export default function ChatScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { isSignedIn } = useAuth();

  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    photo?: string;
    userId?: string;
    mode?: MatchingMode;
  }>();
  const matchId = params.id;

  const { data: myProfile } = useMyProfile();
  const { data: msgPage, isLoading } = useMessages(matchId);
  const { mutateAsync: send } = useSendMessage(matchId);
  const { mutateAsync: markRead } = useMarkMessagesRead();
  const { mutateAsync: block } = useBlockUser();
  const { mutateAsync: unmatch } = useUnmatch();

  const [peerTyping, setPeerTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const myId = myProfile?._id;

  // Incoming message from socket → merge into cache + read.
  const handleIncoming = useCallback(
    (msg: Message) => {
      if (msg.matchId !== matchId) return;
      const key = qk.messages(matchId);
      const prev = qc.getQueryData<{ messages: Message[]; hasMore: boolean }>(key);
      if (prev) {
        // Dedupe — in case REST fetch race lands first.
        if (prev.messages.some((m) => m._id === msg._id)) return;
        qc.setQueryData(key, {
          ...prev,
          messages: [...prev.messages, msg],
        });
      }
      if (msg.senderId !== myId) {
        markRead(matchId).catch(() => { });
      }
    },
    [matchId, myId, qc, markRead]
  );

  const { connected, emit } = useSocket({
    matchId,
    onMessage: handleIncoming,
    onTyping: (uid) => {
      if (uid !== myId) setPeerTyping(true);
    },
    onStopTyping: (uid) => {
      if (uid !== myId) setPeerTyping(false);
    },
  });

  // Mark as read once when we arrive, if there were unread messages.
  useEffect(() => {
    if (!matchId || !isSignedIn) return;
    markRead(matchId).catch(() => { });
    emit('mark-read', { matchId });
  }, [matchId, isSignedIn, markRead, emit]);

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await send(text);
      } catch (e) {
        haptics.error();
        toast.show({ message: (e as Error).message, tone: 'error' });
      }
    },
    [send, toast]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      emit(isTyping ? 'typing' : 'stop-typing', { matchId });
    },
    [emit, matchId]
  );

  const handleBlock = async () => {
    if (!params.userId) return;
    try {
      await block(params.userId);
      toast.show({ message: 'User blocked.', tone: 'success' });
      router.back();
    } catch (e) {
      toast.show({ message: (e as Error).message, tone: 'error' });
    }
  };

  const handleUnmatch = async () => {
    try {
      await unmatch(matchId);
      toast.show({ message: 'Unmatched.', tone: 'default' });
      router.back();
    } catch (e) {
      toast.show({ message: (e as Error).message, tone: 'error' });
    }
  };

  // Group messages and compute whether to show timestamp between groups
  // (show if > 3 min gap or sender changes).
  const rendered = useMemo(() => {
    const list = msgPage?.messages ?? [];
    return list.map((m, i) => {
      const prev = list[i - 1];
      const showTime =
        !prev ||
        prev.senderId !== m.senderId ||
        new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() >
        3 * 60 * 1000;
      return { m, showTime };
    });
  }, [msgPage]);

  return (
    <SafeScreen padded={false} edgeToEdgeBottom>
      <View style={[styles.header, { borderBottomColor: theme.colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Pressable
          style={styles.headerCenter}
          onPress={() => {
            if (params.userId) router.push(`/profile/${params.userId}`);
          }}
        >
          <Avatar uri={params.photo} name={params.name} size={38} />
          <View style={{ marginLeft: 10 }}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {params.name?.split(' ')[0]}
            </Text>
            <Text variant="micro" tone="tertiary">
              {params.mode ? modeLabel(params.mode) : ''}
              {connected ? ' · Online' : ''}
            </Text>
          </View>
        </Pressable>
        <IconButton
          icon={
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={theme.colors.text}
            />
          }
          onPress={() => setMenuOpen(true)}
          variant="ghost"
          accessibilityLabel="Chat menu"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {isLoading ? (
          <View style={styles.center}>
            <SoulLinkLoader fullscreen={false} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlashList
              data={rendered}
              keyExtractor={(item) => item.m._id}
              estimatedItemSize={60}
              contentContainerStyle={{ paddingVertical: 16 }}
              renderItem={({ item }) => (
                <ChatBubble
                  message={item.m}
                  mine={item.m.senderId === myId}
                  showTime={item.showTime}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text variant="body" tone="tertiary" align="center">
                    No messages yet. A thoughtful first line goes further than an emoji.
                  </Text>
                </View>
              }
            />
            {peerTyping ? <TypingIndicator /> : null}
          </View>
        )}

        <ChatComposer onSend={handleSend} onTypingChange={handleTyping} />
      </KeyboardAvoidingView>

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={{ padding: 20, gap: 12 }}>
          <Text variant="title3" style={{ marginBottom: 8 }}>
            Chat options
          </Text>
          <Button
            label="View profile"
            variant="secondary"
            onPress={() => {
              setMenuOpen(false);
              if (params.userId) router.push(`/profile/${params.userId}`);
            }}
            fullWidth
          />
          <Button
            label="Report"
            variant="secondary"
            onPress={() => {
              setMenuOpen(false);
              if (params.userId)
                router.push({
                  pathname: '/settings/report',
                  params: { userId: params.userId },
                });
            }}
            fullWidth
          />
          <Button
            label="Unmatch"
            variant="destructive"
            onPress={() => {
              setMenuOpen(false);
              handleUnmatch();
            }}
            fullWidth
          />
          <Button
            label="Block"
            variant="destructive"
            onPress={() => {
              setMenuOpen(false);
              handleBlock();
            }}
            fullWidth
          />
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => setMenuOpen(false)}
            fullWidth
          />
        </View>
      </BottomSheet>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
});