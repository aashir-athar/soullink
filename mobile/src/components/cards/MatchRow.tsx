// src/components/cards/MatchRow.tsx — One row in the matches list.

import { Avatar } from '@/src/components/ui/Avatar';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import type { Match } from '@/src/types';
import { timeAgoShort } from '@/src/utils/format';
import { modeColor, modeLabel } from '@/src/utils/modes';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface Props {
  match: Match;
  onPress: () => void;
}

function MatchRowBase({ match, onPress }: Props) {
  const { theme } = useTheme();
  const accent = modeColor(match.mode, theme.colors);
  const hasUnread = match.unreadCount > 0;
  const preview =
    match.lastMessage?.content ??
    `You matched for ${modeLabel(match.mode)}. Say hello.`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${match.otherUser.fullName}`}
    >
      <Avatar
        uri={match.otherUser.mainPhoto}
        name={match.otherUser.fullName}
        size={58}
        ring={hasUnread}
        ringColor={accent.base}
      />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
            {match.otherUser.fullName.split(' ')[0]}
          </Text>
          <Text variant="caption" tone="tertiary">
            {match.lastMessage
              ? timeAgoShort(match.lastMessage.createdAt)
              : timeAgoShort(match.createdAt)}
          </Text>
        </View>
        <Text
          variant="body"
          tone={hasUnread ? 'primary' : 'secondary'}
          numberOfLines={1}
          style={{ fontWeight: hasUnread ? '500' : '400' as const }}
        >
          {preview}
        </Text>
        <View style={styles.modePill}>
          <View
            style={[
              styles.dot,
              { backgroundColor: accent.base },
            ]}
          />
          <Text variant="micro" tone="tertiary">
            {modeLabel(match.mode)}
          </Text>
        </View>
      </View>
      {hasUnread ? (
        <View
          style={[
            styles.unreadBadge,
            { backgroundColor: accent.base },
          ]}
        >
          <Text variant="micro" color="#FFFFFF">
            {match.unreadCount > 9 ? '9+' : match.unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 14,
  },
  body: { flex: 1 },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const MatchRow = memo(MatchRowBase);
