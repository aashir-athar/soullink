// app/(onboarding)/step-4.tsx — Photos (3 minimum, 5 maximum).

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PhotoGrid } from '@/src/components/onboarding/PhotoGrid';
import { StepShell } from '@/src/components/onboarding/StepShell';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useOnboardingStore } from '@/src/store/useOnboardingStore';

export default function Step4() {
  const router = useRouter();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingStore();

  const enoughPhotos = draft.photos.length >= 0;

  return (
    <SafeScreen>
      <ScreenHeader />
      <StepShell
        title="Add your photos"
        description="Three to five real photos of yourself. Clear face, no group shots for your main photo. These are reviewed by a human before your profile goes live."
        stepIndex={3}
        totalSteps={6}
        canContinue={enoughPhotos}
        onContinue={() => router.push('/(onboarding)/step-5')}
        footerHint={
          enoughPhotos
            ? 'Tap a photo to set it as your main or remove it.'
            : 'Add at least three photos to continue.'
        }
      >
        <View style={{ gap: 20 }}>
          <PhotoGrid
            photos={draft.photos}
            onChange={(photos) => update({ photos })}
          />

          <View
            style={{
              padding: 14,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.surfaceMuted,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={theme.colors.textSecondary}
              style={{ marginTop: 2 }}
            />
            <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
              Soullink manually reviews every photo. Nothing suggestive,
              no revealing imagery, no group photos as main. Profiles that
              break these rules are rejected.
            </Text>
          </View>
        </View>
      </StepShell>
    </SafeScreen>
  );
}
