// app/(onboarding)/step-3.tsx — Religion.
//
// Religion is only *required* for Marriage mode matching. We explain this
// upfront so users who skip it understand the consequence.

import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { StepShell } from '@/src/components/onboarding/StepShell';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SearchableSelect } from '@/src/components/ui/SearchableSelect';
import { Text } from '@/src/components/ui/Text';
import { RELIGION_OPTIONS } from '@/src/constants/data';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useOnboardingStore } from '@/src/store/useOnboardingStore';

export default function Step3() {
  const router = useRouter();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingStore();

  return (
    <SafeScreen>
      <ScreenHeader />
      <StepShell
        title="Your faith"
        description="Marriage mode only matches people of the same religion. Other modes ignore this field."
        stepIndex={2}
        totalSteps={6}
        canContinue={!!draft.religion}
        onContinue={() => router.push('/(onboarding)/step-4')}
      >
        <View style={{ gap: 16 }}>
          <SearchableSelect
            label="Religion"
            value={draft.religion}
            options={RELIGION_OPTIONS}
            onChange={(v) => update({ religion: v as typeof draft.religion })}
          />
          <View
            style={{
              padding: 14,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.surfaceMuted,
            }}
          >
            <Text variant="caption" tone="secondary">
              You can always change this later in your profile. Choosing
              "Prefer not to say" means Marriage mode won't show you results.
            </Text>
          </View>
        </View>
      </StepShell>
    </SafeScreen>
  );
}
