// app/profile/[userId].tsx — Read-only profile view.

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Chip } from '@/src/components/ui/Chip';
import { CompatibilityBadge } from '@/src/components/ui/CompatibilityBadge';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SoulLinkLoader } from '@/src/components/ui/SoulLinkLoader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useUser } from '@/src/hooks/useApi';
import { locationLabel, religionLabel } from '@/src/utils/format';

const { width } = Dimensions.get('window');

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { data: user, isLoading } = useUser(userId);

  const [photoIndex, setPhotoIndex] = useState(0);

  if (isLoading) {
    return (
      <SafeScreen>
        <ScreenHeader title="" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <SoulLinkLoader fullscreen={false} />
        </View>
      </SafeScreen>
    );
  }

  if (!user) {
    return (
      <SafeScreen>
        <ScreenHeader title="" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="body" tone="secondary">Profile unavailable.</Text>
        </View>
      </SafeScreen>
    );
  }

  const photos = user.photos?.length ? user.photos : [user.mainPhoto];

  return (
    <SafeScreen padded={false} edgeToEdgeTop>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: photos[photoIndex] }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
          {/* Tap-left / tap-right to change photo */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setPhotoIndex((i) => Math.max(0, i - 1))}
            />
            <Pressable
              style={{ flex: 1 }}
              onPress={() =>
                setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))
              }
            />
          </View>
          {/* Photo dots */}
          <View style={styles.photoDots}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.photoDot,
                  {
                    backgroundColor:
                      i === photoIndex
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.35)',
                  },
                ]}
              />
            ))}
          </View>
          {/* Close */}
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.closeBtn,
              { backgroundColor: 'rgba(0,0,0,0.4)' },
            ]}
            accessibilityLabel="Close profile"
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={{ padding: 20 }}>
          <View style={styles.nameRow}>
            <Text variant="title1">
              {user.fullName.split(' ')[0]}, {user.age}
            </Text>
            {user.compatibilityScore > 0 ? (
              <CompatibilityBadge score={user.compatibilityScore} />
            ) : null}
          </View>
          <Text variant="body" tone="secondary" style={{ marginBottom: 16 }}>
            {locationLabel(user.city, user.country)}
          </Text>

          {user.bio ? (
            <Text variant="bodyLarge" style={{ marginBottom: 24 }}>
              {user.bio}
            </Text>
          ) : null}

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <InfoRow icon="book-outline" label="Faith" value={religionLabel(user.religion)} />
            {user.occupation ? (
              <InfoRow icon="briefcase-outline" label="Work" value={user.occupation} />
            ) : null}
          </View>

          {user.interests?.length > 0 ? (
            <>
              <Text
                variant="captionMedium"
                tone="tertiary"
                style={{ marginTop: 28, marginBottom: 12, letterSpacing: 0.6 }}
              >
                INTERESTS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {user.interests.map((i) => (
                  <Chip key={i} label={i} size="sm" variant="outline" />
                ))}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      <Text variant="body" tone="secondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    width,
    height: width * 1.25,
    backgroundColor: '#000',
    position: 'relative',
  },
  photoDots: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  photoDot: { flex: 1, height: 3, borderRadius: 2 },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 12,
  },
  infoCard: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});