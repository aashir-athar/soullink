// app/settings/blocked.tsx — Manage blocked users.

import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/src/components/ui/EmptyState';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SoulLinkLoader } from '@/src/components/ui/SoulLinkLoader';
import { Text } from '@/src/components/ui/Text';
import { useToast } from '@/src/components/ui/Toast';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useBlockedUsers, useUnblockUser } from '@/src/hooks/useApi';

export default function Blocked() {
  const { theme } = useTheme();
  const toast = useToast();
  const { data: blocked, isLoading, refetch } = useBlockedUsers();
  const { mutateAsync: unblock } = useUnblockUser();

  const handleUnblock = async (userId: string) => {
    try {
      await unblock(userId);
      toast.show({ message: 'User unblocked.', tone: 'success' });
      refetch();
    } catch (e) {
      toast.show({ message: (e as Error).message, tone: 'error' });
    }
  };

  return (
    <SafeScreen padded={false}>
      <ScreenHeader title="Blocked users" />

      {isLoading ? (
        <View style={styles.center}>
          <SoulLinkLoader fullscreen={false} />
        </View>
      ) : !blocked || blocked.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="ban-outline" size={36} color={theme.colors.textSecondary} />}
          title="No blocked users"
          description="People you block can't see your profile and can't message you."
        />
      ) : (
        <FlashList
          data={blocked}
          keyExtractor={(id) => id}
          estimatedItemSize={60}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text variant="body" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
                User ID: {item.slice(-8)}
              </Text>
              <Pressable onPress={() => handleUnblock(item)}>
                <Text variant="bodyMedium" tone="accent">
                  Unblock
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});