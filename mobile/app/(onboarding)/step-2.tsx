// app/(onboarding)/step-2.tsx — Country + city.

import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { StepShell } from '@/src/components/onboarding/StepShell';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SearchableSelect } from '@/src/components/ui/SearchableSelect';
import { CITIES_BY_COUNTRY, COUNTRIES } from '@/src/constants/data';
import { useOnboardingStore } from '@/src/store/useOnboardingStore';

export default function Step2() {
  const router = useRouter();
  const { draft, update } = useOnboardingStore();

  const countryOptions = useMemo(
    () => COUNTRIES.map((c) => ({ value: c, label: c })),
    []
  );

  const cityOptions = useMemo(() => {
    const cities = CITIES_BY_COUNTRY[draft.country] ?? [];
    return cities.map((c) => ({ value: c, label: c }));
  }, [draft.country]);

  const canContinue = !!draft.country && !!draft.city;

  return (
    <SafeScreen>
      <ScreenHeader />
      <StepShell
        title="Where do you live?"
        description="City helps us rank profiles that are actually near you. We never show your live location."
        stepIndex={1}
        totalSteps={6}
        canContinue={canContinue}
        onContinue={() => router.push('/(onboarding)/step-3')}
      >
        <View style={{ gap: 20 }}>
          <SearchableSelect
            label="Country"
            placeholder="Select country"
            value={draft.country}
            options={countryOptions}
            onChange={(v) => update({ country: v, city: '' })}
          />
          <SearchableSelect
            label="City"
            placeholder={
              draft.country ? 'Select city' : 'Select a country first'
            }
            value={draft.city}
            options={cityOptions}
            onChange={(v) => update({ city: v })}
            disabled={!draft.country}
          />
        </View>
      </StepShell>
    </SafeScreen>
  );
}
