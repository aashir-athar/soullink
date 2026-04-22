// app/(tabs)/matches.tsx — Matches list (new matches + existing conversations).
//
// We split matches into "New" (no messages yet) at the top as a horizontal
// reel, and "Conversations" below. This follows the well-known Tinder/Hinge
// pattern — familiar mental model = less friction for new users.

import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { MatchRow } from '@/src/components/cards/MatchRow';
import { Avatar } from '@/src/components/ui/Avatar';
import { Divider } from '@/src/components/ui/Divider';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { SoulLinkLoader } from '@/src/components/ui/SoulLinkLoader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useMatches } from '@/src/hooks/useApi';
import type { Match } from '@/src/types';
import { modeColor, modeLabel } from '@/src/utils/modes';
import { Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

export default function MatchesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: matches, isLoading, refetch, isRefetching } = useMatches();

  const newMatches = useMemo(
    () => (matches ?? []).filter((m) => !m.lastMessage),
    [matches]
  );
  const convos = useMemo(
    () => (matches ?? []).filter((m) => !!m.lastMessage),
    [matches]
  );

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
        <Text variant="title2">Matches</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <SoulLinkLoader fullscreen={false} />
        </View>
      ) : !matches || matches.length === 0 ? (
        <EmptyState
          icon={
            <Ionicons
              name="heart-outline"
              size={38}
              color={theme.colors.textSecondary}
            />
          }
          title="No matches yet"
          description="Keep exploring. When two people like each other, it shows up here."
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
          ListHeaderComponent={
            newMatches.length > 0 ? (
              <View style={{ paddingTop: 8 }}>
                <Text
                  variant="captionMedium"
                  tone="tertiary"
                  style={{ paddingHorizontal: 20, marginBottom: 10, letterSpacing: 0.6 }}
                >
                  NEW MATCHES
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 20,
                    gap: 16,
                    paddingBottom: 20,
                  }}
                >
                  {newMatches.map((m) => {
                    const accent = modeColor(m.mode, theme.colors);
                    return (
                      <Pressable
                        key={m._id}
                        onPress={() => openChat(m)}
                        style={{ alignItems: 'center', width: 76 }}
                      >
                        <Avatar
                          uri={m.otherUser.mainPhoto}
                          name={m.otherUser.fullName}
                          size={68}
                          ring
                          ringColor={accent.base}
                        />
                        <Text
                          variant="captionMedium"
                          numberOfLines={1}
                          style={{ marginTop: 8 }}
                        >
                          {m.otherUser.fullName.split(' ')[0]}
                        </Text>
                        <Text
                          variant="micro"
                          tone="tertiary"
                          numberOfLines={1}
                          style={{ marginTop: 2 }}
                        >
                          {modeLabel(m.mode)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Divider />
                <Text
                  variant="captionMedium"
                  tone="tertiary"
                  style={{
                    paddingHorizontal: 20,
                    marginTop: 16,
                    marginBottom: 8,
                    letterSpacing: 0.6,
                  }}
                >
                  CONVERSATIONS
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <MatchRow match={item} onPress={() => openChat(item)} />
          )}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            newMatches.length > 0 ? (
              <View style={{ padding: 20 }}>
                <Text variant="body" tone="secondary" align="center">
                  Start the conversation above. One thoughtful first message goes a long way.
                </Text>
              </View>
            ) : null
          }
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