// app/settings/safety.tsx — Static safety/privacy guide.

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';

const points: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Every profile is verified',
    body: 'Each user submits a live selfie matching one of their profile photos. A human reviews it before their profile goes live.',
  },
  {
    icon: 'eye-off-outline',
    title: 'Your live location is never shared',
    body: 'We use city only. No GPS tracking, no map, no "nearby right now".',
  },
  {
    icon: 'ban-outline',
    title: 'Block and report anytime',
    body: 'Blocking deactivates any existing match. Reports are reviewed within 24 hours.',
  },
  {
    icon: 'heart-dislike-outline',
    title: 'Daily limits by design',
    body: '100 likes and 5 compliments a day. No way to buy more. Prevents burnout, spam, and shallow swiping.',
  },
  {
    icon: 'chatbubble-outline',
    title: 'Text-only messaging',
    body: 'No images, no voice notes, no video. Keeps conversations focused and safer.',
  },
  {
    icon: 'sparkles-outline',
    title: 'No AI in your experience',
    body: 'No smart replies, no auto-generated messages, no facial analysis. Just people meeting people.',
  },
];

export default function Safety() {
  const { theme } = useTheme();
  return (
    <SafeScreen>
      <ScreenHeader title="Privacy & safety" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title1" style={{ marginBottom: 12 }}>
          Safe, by design.
        </Text>
        <Text variant="bodyLarge" tone="secondary" style={{ marginBottom: 28 }}>
          We built Soullink around a few non-negotiable rules.
        </Text>

        <View style={{ gap: 18 }}>
          {points.map((p) => (
            <View
              key={p.title}
              style={{
                flexDirection: 'row',
                gap: 14,
                padding: 16,
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.surface,
                borderWidth: 0.5,
                borderColor: theme.colors.borderSubtle,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surfaceMuted,
                }}
              >
                <Ionicons name={p.icon} size={20} color={theme.colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ marginBottom: 4 }}>
                  {p.title}
                </Text>
                <Text variant="body" tone="secondary">
                  {p.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
