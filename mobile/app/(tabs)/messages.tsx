// app/(tabs)/messages.tsx — Conversations, ordered by most recent activity.

import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { MatchRow } from '@/src/components/cards/MatchRow';
import { Divider } from '@/src/components/ui/Divider';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { SoulLinkLoader } from '@/src/components/ui/SoulLinkLoader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useMatches } from '@/src/hooks/useApi';
import type { Match } from '@/src/types';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: matches, isLoading, refetch, isRefetching } = useMatches();

  const convos = useMemo(() => {
    const withMsgs = (matches ?? []).filter((m) => !!m.lastMessage);
    return [...withMsgs].sort((a, b) => {
      const at = a.lastMessage?.createdAt ?? a.createdAt;
      const bt = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bt).getTime() - new Date(at).getTime();
    });
  }, [matches]);

  const openChat = (m: Match) => {
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: m._id,
        name: m.otherUser.fullName,
        photo: m.otherUser.mainPhoto,
        userId: m.otherUser.userId,
        mode: m.mode,
      },
    });
  };

  return (
    <SafeScreen edgeToEdgeBottom padded={false}>
      <View style={styles.headerRow}>
        <Text variant="title2">Messages</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <SoulLinkLoader fullscreen={false} />
        </View>
      ) : convos.length === 0 ? (
        <EmptyState
          icon={
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={38}
              color={theme.colors.textSecondary}
            />
          }
          title="No conversations yet"
          description="Once you've matched with someone, your chats will appear here."
        />
      ) : (
        <FlashList
          data={convos}
          keyExtractor={(m) => m._id}
          estimatedItemSize={76}
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'ios' ? 100 : 88,
          }}
          ItemSeparatorComponent={() => <Divider inset={16} />}
          renderItem={({ item }) => (
            <MatchRow match={item} onPress={() => openChat(item)} />
          )}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});