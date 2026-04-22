// app/(onboarding)/step-5.tsx — Choose minimum 8 interests from 60+.

import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { StepShell } from '@/src/components/onboarding/StepShell';
import { Chip } from '@/src/components/ui/Chip';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { INTERESTS } from '@/src/constants/data';
import { useOnboardingStore } from '@/src/store/useOnboardingStore';

const MIN_INTERESTS = 8;

export default function Step5() {
  const router = useRouter();
  const { draft, update } = useOnboardingStore();

  const toggle = useCallback(
    (tag: string) => {
      const has = draft.interests.includes(tag);
      update({
        interests: has
          ? draft.interests.filter((i) => i !== tag)
          : [...draft.interests, tag],
      });
    },
    [draft.interests, update]
  );

  const enough = draft.interests.length >= MIN_INTERESTS;

  return (
    <SafeScreen>
      <ScreenHeader />
      <StepShell
        title="What lights you up?"
        description={`Pick at least ${MIN_INTERESTS}. These drive how Soullink ranks compatibility.`}
        stepIndex={4}
        totalSteps={6}
        canContinue={enough}
        onContinue={() => router.push('/(onboarding)/step-6')}
        footerHint={
          enough
            ? `${draft.interests.length} selected — you can always add more later.`
            : `${draft.interests.length} of ${MIN_INTERESTS} selected.`
        }
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {INTERESTS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={draft.interests.includes(tag)}
              onPress={() => toggle(tag)}
              variant="outline"
              size="sm"
            />
          ))}
        </View>
      </StepShell>
    </SafeScreen>
  );
}
