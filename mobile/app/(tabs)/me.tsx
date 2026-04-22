// app/(tabs)/me.tsx — "Me" tab: profile card + quick actions.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Avatar } from '@/src/components/ui/Avatar';
import { Chip } from '@/src/components/ui/Chip';
import { Divider } from '@/src/components/ui/Divider';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useMyProfile } from '@/src/hooks/useApi';
import { locationLabel, religionLabel } from '@/src/utils/format';
import { modeColor, modeLabel } from '@/src/utils/modes';

export default function Me() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: profile, refetch, isRefetching } = useMyProfile();

  if (!profile) return <SafeScreen />;

  return (
    <SafeScreen edgeToEdgeBottom padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 100 : 88,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
      >
        <View style={styles.header}>
          <Avatar
            uri={profile.photos.find((p) => p.isMain)?.cloudinaryUrl ?? profile.photos[0]?.cloudinaryUrl}
            name={profile.fullName}
            size={96}
          />
          <Text variant="title1" style={{ marginTop: 14 }}>
            {profile.fullName}, {profile.age}
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 2 }}>
            {locationLabel(profile.city, profile.country)}
          </Text>

          <View style={styles.modeRow}>
            {profile.lookingFor.map((m) => {
              const accent = modeColor(m, theme.colors);
              return (
                <View
                  key={m}
                  style={[
                    styles.modeTag,
                    {
                      backgroundColor: accent.soft,
                      borderRadius: theme.radii.pill,
                    },
                  ]}
                >
                  <View
                    style={[styles.dot, { backgroundColor: accent.base }]}
                  />
                  <Text variant="micro" style={{ color: accent.base }}>
                    {modeLabel(m).toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={() => router.push('/profile/edit')}
            style={[
              styles.editBtn,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radii.pill,
              },
            ]}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={theme.colors.text}
            />
            <Text variant="bodyMedium">Edit profile</Text>
          </Pressable>
        </View>

        <Section title="About">
          <Row label="Religion" value={religionLabel(profile.religion)} />
          {profile.occupation ? (
            <Row label="Work" value={profile.occupation} />
          ) : null}
          {profile.height ? (
            <Row label="Height" value={`${profile.height} cm`} />
          ) : null}
          {profile.educationLevel ? (
            <Row label="Education" value={profile.educationLevel.replace('_', ' ')} />
          ) : null}
        </Section>

        {profile.interests.length > 0 ? (
          <Section title="Interests">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {profile.interests.map((i) => (
                <Chip key={i} label={i} size="sm" variant="outline" />
              ))}
            </View>
          </Section>
        ) : null}

        <View style={styles.menu}>
          <MenuItem
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/settings')}
          />
          <Divider inset={60} />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy & safety"
            onPress={() => router.push('/settings/safety')}
          />
          <Divider inset={60} />
          <MenuItem
            icon="help-circle-outline"
            label="Help & rules"
            onPress={() => router.push('/settings/help')}
          />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text
        variant="captionMedium"
        tone="tertiary"
        style={{ marginBottom: 12, letterSpacing: 0.6 }}
      >
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.aboutRow}>
      <Text variant="body" tone="secondary">
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={theme.colors.textSecondary} />
      <Text variant="bodyLarge" style={{ flex: 1 }}>
        {label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.colors.textTertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  editBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 4,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menu: {
    marginTop: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
