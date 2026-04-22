// app/welcome.tsx — First impression screen.
//
// Structure:
//   - Soullink wordmark + 1-line promise
//   - Three-path illustration (text-only cards, no images — loads instantly
//     on any device and emphasises the product's clarity)
//   - Primary CTA: Create account
//   - Secondary: Log in
//   - Tertiary: How Soullink works (expands inline)
//
// Psychology:
//   - Loss-aversion traps are absent on purpose. We lead with clarity
//     ("choose how you connect") rather than urgency.
//   - Offering three paths as equal-status cards primes users to commit
//     to intent before photos — reducing later decision fatigue.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button } from '@/src/components/ui/Button';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { Text } from '@/src/components/ui/Text';
import { MODES } from '@/src/constants/data';
import { useTheme } from '@/src/contexts/ThemeContext';
import type { MatchingMode } from '@/src/types';
import { modeColor } from '@/src/utils/modes';

export default function Welcome() {
  const { theme } = useTheme();
  const router = useRouter();
  const [howOpen, setHowOpen] = useState(false);

  const iconFor = (mode: MatchingMode) =>
    mode === 'friendship'
      ? 'people-outline'
      : mode === 'relationship'
        ? 'heart-outline'
        : 'ribbon-outline';

  return (
    <SafeScreen edgeToEdgeTop>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 64,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(500)}>
          <Text
            variant="micro"
            tone="tertiary"
            style={{ letterSpacing: 1.4, marginBottom: 14 }}
          >
            SOULLINK
          </Text>
          <Text
            variant="display"
            style={{ marginBottom: 18 }}
          >
            Meaningful connections.{'\n'}Three paths. One soul.
          </Text>
          <Text variant="bodyLarge" tone="secondary" style={{ marginBottom: 40 }}>
            No gimmicks, no paywalls, no endless swiping.
            Choose how you want to connect — and mean it.
          </Text>
        </Animated.View>

        <View style={{ gap: 12, marginBottom: 28 }}>
          {MODES.map((m, i) => {
            const accent = modeColor(m.value, theme.colors);
            return (
              <Animated.View
                key={m.value}
                entering={FadeInDown.delay(120 * (i + 1)).duration(420)}
              >
                <View
                  style={[
                    styles.pathCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.borderSubtle,
                      borderRadius: theme.radii.xl,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pathIcon,
                      { backgroundColor: accent.soft },
                    ]}
                  >
                    <Ionicons
                      name={iconFor(m.value)}
                      size={22}
                      color={accent.base}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="title3" style={{ marginBottom: 2 }}>
                      {m.label}
                    </Text>
                    <Text variant="body" tone="secondary">
                      {m.description}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        <Pressable
          onPress={() => setHowOpen((v) => !v)}
          style={styles.howRow}
          accessibilityRole="button"
        >
          <Text variant="bodyMedium" tone="secondary">
            How Soullink works
          </Text>
          <Ionicons
            name={howOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textSecondary}
          />
        </Pressable>

        {howOpen ? (
          <Animated.View
            entering={FadeInDown.duration(240)}
            style={[
              styles.howBox,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <Row icon="person-add-outline" text="Create one profile with up to 5 photos." />
            <Row icon="shield-checkmark-outline" text="Verify with a quick selfie — reviewed by a human." />
            <Row icon="options-outline" text="Pick one or more of the three paths to connect on." />
            <Row icon="heart-outline" text="100 likes and 5 compliments a day. Reset every night." />
            <Row icon="chatbubble-ellipses-outline" text="Text-only chat. No media pressure. No games." />
          </Animated.View>
        ) : null}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: Platform.OS === 'ios' ? 8 : 16,
          gap: 12,
        }}
      >
        <Button
          label="Create account"
          fullWidth
          onPress={() => router.push('/(auth)/sign-up')}
        />
        <Button
          label="I already have an account"
          variant="ghost"
          fullWidth
          onPress={() => router.push('/(auth)/sign-in')}
        />
      </View>
    </SafeScreen>
  );
}

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.howItem}>
      <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      <Text variant="body" tone="secondary" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pathCard: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pathIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  howBox: {
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  howItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
});
