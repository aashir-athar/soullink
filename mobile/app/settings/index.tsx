// app/settings/index.tsx — Main settings screen.

import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Divider } from '@/src/components/ui/Divider';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Text } from '@/src/components/ui/Text';
import { useToast } from '@/src/components/ui/Toast';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useDeleteAccount } from '@/src/hooks/useApi';
import { haptics } from '@/src/utils/haptics';

export default function Settings() {
  const { theme, preference, setPreference } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { signOut } = useAuth();
  const { mutateAsync: deleteAccount, isPending } = useDeleteAccount();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteAccount();
      haptics.success();
      await signOut();
      router.replace('/welcome');
    } catch (e) {
      toast.show({ message: (e as Error).message, tone: 'error' });
    }
  };

  return (
    <SafeScreen padded={false}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <Section title="APPEARANCE">
          <ThemeRow
            label="Match system"
            active={preference === 'system'}
            onPress={() => setPreference('system')}
          />
          <Divider inset={20} />
          <ThemeRow
            label="Light"
            active={preference === 'light'}
            onPress={() => setPreference('light')}
          />
          <Divider inset={20} />
          <ThemeRow
            label="Dark"
            active={preference === 'dark'}
            onPress={() => setPreference('dark')}
          />
        </Section>

        <Section title="PRIVACY & SAFETY">
          <NavRow
            icon="shield-checkmark-outline"
            label="Privacy & safety"
            onPress={() => router.push('/settings/safety')}
          />
          <Divider inset={60} />
          <NavRow
            icon="ban-outline"
            label="Blocked users"
            onPress={() => router.push('/settings/blocked')}
          />
        </Section>

        <Section title="HELP">
          <NavRow
            icon="book-outline"
            label="Community rules"
            onPress={() => router.push('/settings/help')}
          />
        </Section>

        <Section title="ACCOUNT">
          <NavRow
            icon="log-out-outline"
            label="Sign out"
            onPress={() => {
              signOut();
              router.replace('/welcome');
            }}
          />
          <Divider inset={60} />
          <NavRow
            icon="trash-outline"
            label="Delete account"
            destructive
            onPress={() => setConfirmDelete(true)}
          />
        </Section>

        <Text
          variant="micro"
          tone="tertiary"
          align="center"
          style={{ marginTop: 32, letterSpacing: 0.6 }}
        >
          SOULLINK · v1.0.0
        </Text>
      </ScrollView>

      <BottomSheet visible={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <View style={{ padding: 20, gap: 12 }}>
          <Text variant="title3">Delete your account?</Text>
          <Text variant="body" tone="secondary">
            This removes your profile, photos, matches, and messages permanently.
            You'll need to sign up again to use Soullink.
          </Text>
          <Button
            label="Delete permanently"
            variant="destructive"
            onPress={handleDelete}
            loading={isPending}
            fullWidth
          />
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => setConfirmDelete(false)}
            fullWidth
          />
        </View>
      </BottomSheet>
    </SafeScreen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ marginTop: 20 }}>
      <Text
        variant="captionMedium"
        tone="tertiary"
        style={{
          paddingHorizontal: 20,
          marginBottom: 8,
          letterSpacing: 0.6,
        }}
      >
        {title}
      </Text>
      <View style={{ backgroundColor: theme.colors.surface }}>{children}</View>
    </View>
  );
}

function ThemeRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
      ]}
    >
      <Text variant="bodyLarge" style={{ flex: 1 }}>
        {label}
      </Text>
      {active ? (
        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
      ) : null}
    </Pressable>
  );
}

function NavRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { theme } = useTheme();
  const color = destructive ? theme.colors.error : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={destructive ? theme.colors.error : theme.colors.textSecondary}
      />
      <Text variant="bodyLarge" style={{ flex: 1, color }}>
        {label}
      </Text>
      {!destructive ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textTertiary}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
