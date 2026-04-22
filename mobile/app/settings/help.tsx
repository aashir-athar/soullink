// app/settings/help.tsx — FAQ + community rules.

import React from 'react';
import { ScrollView, View } from 'react-native';

import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';

const sections: { title: string; body: string }[] = [
  {
    title: 'Three clear paths',
    body: 'Friendship matches any gender. Relationship/Lover is opposite gender only. Marriage is opposite gender plus same religion. You can be active in one, two, or all three at the same time.',
  },
  {
    title: 'No catfishing. Ever.',
    body: 'Every profile is verified with a live selfie that a human reviews. Fake accounts, photos of other people, or heavily edited photos are removed on sight.',
  },
  {
    title: 'Respectful conversation',
    body: 'No harassment, no slurs, no unsolicited explicit content. Text only. Report anything that makes you uncomfortable — we take every report seriously.',
  },
  {
    title: 'Photo rules',
    body: 'Three to five photos of yourself. Clear face in your main photo. No group shots as main, no revealing or sexual content, no edits that change your appearance. Violators are rejected during verification.',
  },
  {
    title: 'Daily limits',
    body: '100 likes and 5 compliments per day, total across all three modes. Limits reset at midnight (Pakistan time). There is no way to buy more — this is the product.',
  },
  {
    title: 'Age rule',
    body: 'Soullink is strictly 18+. Under-18 profiles, or accounts suspected of being underage, are removed immediately.',
  },
  {
    title: 'What Soullink does not do',
    body: 'No AI-generated messages. No paid subscriptions. No videos. No live maps. No social feed. No groups. No events.',
  },
];

export default function Help() {
  const { theme } = useTheme();
  return (
    <SafeScreen>
      <ScreenHeader title="Community rules" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title1" style={{ marginBottom: 12 }}>
          How Soullink works.
        </Text>
        <Text variant="bodyLarge" tone="secondary" style={{ marginBottom: 28 }}>
          A short, honest guide. Keep it handy.
        </Text>

        <View style={{ gap: 22 }}>
          {sections.map((s) => (
            <View key={s.title}>
              <Text variant="title3" style={{ marginBottom: 8 }}>
                {s.title}
              </Text>
              <Text variant="body" tone="secondary">
                {s.body}
              </Text>
            </View>
          ))}
        </View>

        <Text
          variant="caption"
          tone="tertiary"
          style={{ marginTop: 40, lineHeight: 20 }}
        >
          Breaking these rules results in removal without warning. We're
          building a space for meaningful connection — thank you for
          respecting that.
        </Text>
      </ScrollView>
    </SafeScreen>
  );
}
