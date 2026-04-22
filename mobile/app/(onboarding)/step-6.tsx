// app/(onboarding)/step-6.tsx — "What are you looking for" + optional
// lifestyle fields, then create the profile.
//
// On "Complete my profile" the entire draft (including local photos) is sent
// to the backend in one atomic operation: photos are uploaded to Cloudinary
// inside createProfile(), then the profile document is created in MongoDB.

import { useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { StepShell } from '@/src/components/onboarding/StepShell';
import { Chip } from '@/src/components/ui/Chip';
import { Input } from '@/src/components/ui/Input';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SearchableSelect } from '@/src/components/ui/SearchableSelect';
import { Text } from '@/src/components/ui/Text';
import { EDUCATION_OPTIONS, MODES } from '@/src/constants/data';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useCreateProfile } from '@/src/hooks/useApi';
import { useOnboardingStore } from '@/src/store/useOnboardingStore';
import type {
  EducationLevel,
  MatchingMode,
  Personality,
  YesNoMaybe,
  YesNoSometimes,
} from '@/src/types';
import { haptics } from '@/src/utils/haptics';

export default function Step6() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const { draft, update, reset } = useOnboardingStore();
  const { mutateAsync: createProfile, isPending } = useCreateProfile();
  const [error, setError] = useState<string | null>(null);

  const toggleMode = (mode: MatchingMode) => {
    const has = draft.lookingFor.includes(mode);
    update({
      lookingFor: has
        ? draft.lookingFor.filter((m) => m !== mode)
        : [...draft.lookingFor, mode],
    });
  };

  const canContinue = draft.lookingFor.length > 0;

  const handleSubmit = async () => {
    if (!draft.gender || !draft.dateOfBirth) return;
    setError(null);
    try {
      // createProfile() uploads all local photos to Cloudinary first,
      // then POSTs the complete profile to MongoDB — one atomic operation.
      await createProfile({
        fullName: draft.fullName,
        gender: draft.gender,
        dateOfBirth: draft.dateOfBirth,
        city: draft.city,
        country: draft.country,
        religion: draft.religion,
        photos: draft.photos,       // LocalPhoto[] — uploaded inside createProfile
        interests: draft.interests,
        lookingFor: draft.lookingFor,
        bio: draft.bio,
        occupation: draft.occupation,
        height: draft.height,
        educationLevel: draft.educationLevel,
        smoking: draft.smoking,
        drinking: draft.drinking,
        wantKids: draft.wantKids,
        personality: draft.personality,
        email: clerkUser?.primaryEmailAddress?.emailAddress,
      });
      haptics.success();
      reset();
      router.replace('/(verification)/selfie');
    } catch (e) {
      const err = e as Error;
      setError(err.message ?? 'Something went wrong. Please try again.');
      haptics.error();
    }
  };

  return (
    <SafeScreen keyboardAvoiding>
      <ScreenHeader />
      <StepShell
        title="What are you looking for?"
        description="Pick one or all three. You can switch between them anytime."
        stepIndex={5}
        totalSteps={6}
        canContinue={canContinue}
        onContinue={handleSubmit}
        continueLabel="Complete my profile"
        loading={isPending}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 10, marginBottom: 28 }}>
            {MODES.map((m) => (
              <Chip
                key={m.value}
                label={`${m.label} — ${m.description}`}
                selected={draft.lookingFor.includes(m.value)}
                onPress={() => toggleMode(m.value)}
                variant="outline"
                size="md"
                style={{ alignSelf: 'stretch', height: 'auto', paddingVertical: 14 }}
              />
            ))}
          </View>

          <Text variant="title3" style={{ marginBottom: 6, marginTop: 8 }}>
            A few more details (optional)
          </Text>
          <Text variant="body" tone="secondary" style={{ marginBottom: 24 }}>
            These sharpen your matches. Skip any you'd rather not share.
          </Text>

          <View style={{ gap: 18 }}>
            <Input
              label="Bio"
              value={draft.bio}
              onChangeText={(bio) => update({ bio })}
              placeholder="A short sentence about you."
              multiline
              maxLength={500}
            />
            <Input
              label="Occupation"
              value={draft.occupation}
              onChangeText={(occupation) => update({ occupation })}
              placeholder="What you do"
              maxLength={100}
            />
            <Input
              label="Height (cm)"
              value={draft.height ? String(draft.height) : ''}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                update({ height: Number.isFinite(n) ? n : null });
              }}
              placeholder="175"
              keyboardType="number-pad"
              maxLength={3}
            />
            <SearchableSelect
              label="Education"
              value={draft.educationLevel ?? ''}
              options={EDUCATION_OPTIONS}
              onChange={(v) => update({ educationLevel: v as EducationLevel })}
            />
            <OptionalPicker
              label="Want kids?"
              options={[
                { v: 'yes', l: 'Yes' },
                { v: 'maybe', l: 'Maybe' },
                { v: 'no', l: 'No' },
              ]}
              value={draft.wantKids}
              onChange={(v) => update({ wantKids: v as YesNoMaybe })}
            />
            <OptionalPicker
              label="Smoking"
              options={[
                { v: 'no', l: 'No' },
                { v: 'sometimes', l: 'Sometimes' },
                { v: 'yes', l: 'Yes' },
              ]}
              value={draft.smoking}
              onChange={(v) => update({ smoking: v as YesNoSometimes })}
            />
            <OptionalPicker
              label="Drinking"
              options={[
                { v: 'no', l: 'No' },
                { v: 'sometimes', l: 'Sometimes' },
                { v: 'yes', l: 'Yes' },
              ]}
              value={draft.drinking}
              onChange={(v) => update({ drinking: v as YesNoSometimes })}
            />
            <OptionalPicker
              label="Personality"
              options={[
                { v: 'introvert', l: 'Introvert' },
                { v: 'ambivert', l: 'Ambivert' },
                { v: 'extrovert', l: 'Extrovert' },
              ]}
              value={draft.personality}
              onChange={(v) => update({ personality: v as Personality })}
            />
          </View>

          {error ? (
            <Text
              variant="caption"
              tone="error"
              style={{
                marginTop: 18,
                padding: 12,
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radii.md,
              }}
            >
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </StepShell>
    </SafeScreen>
  );
}

function OptionalPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: string; l: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <View>
      <Text
        variant="captionMedium"
        tone="secondary"
        style={{ marginBottom: 8, marginLeft: 4 }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <Chip
            key={o.v}
            label={o.l}
            selected={value === o.v}
            onPress={() => onChange(o.v)}
            variant="outline"
          />
        ))}
      </View>
    </View>
  );
}