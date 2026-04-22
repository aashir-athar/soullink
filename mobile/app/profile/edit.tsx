// app/profile/edit.tsx — Edit profile (post-onboarding).
//
// We allow editing:
//   - Photos (add / remove / reorder main)
//   - Bio, occupation, height, education, lifestyle fields
//   - City, religion (these re-filter marriage/friend matches)
//   - Interests
//   - Looking for (mode selection)
//
// Gender, DOB, age are intentionally immutable (server-side too).

import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { PhotoGrid } from '@/src/components/onboarding/PhotoGrid';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { Input } from '@/src/components/ui/Input';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SearchableSelect } from '@/src/components/ui/SearchableSelect';
import { Text } from '@/src/components/ui/Text';
import { useToast } from '@/src/components/ui/Toast';
import {
  CITIES_BY_COUNTRY,
  COUNTRIES,
  EDUCATION_OPTIONS,
  INTERESTS,
  MODES,
  RELIGION_OPTIONS,
} from '@/src/constants/data';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  useMyProfile,
  useUpdateProfile,
} from '@/src/hooks/useApi';
import type {
  EducationLevel,
  MatchingMode,
  Personality,
  Photo,
  Religion,
  YesNoMaybe,
  YesNoSometimes,
} from '@/src/types';
import { haptics } from '@/src/utils/haptics';

export default function EditProfile() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { data: profile } = useMyProfile();
  const { mutateAsync: update, isPending } = useUpdateProfile();

  const [form, setForm] = useState({
    country: '',
    city: '',
    religion: 'prefer_not_to_say' as Religion,
    bio: '',
    occupation: '',
    height: '',
    educationLevel: '' as EducationLevel | '',
    smoking: null as YesNoSometimes | null,
    drinking: null as YesNoSometimes | null,
    wantKids: null as YesNoMaybe | null,
    personality: null as Personality | null,
    interests: [] as string[],
    lookingFor: [] as MatchingMode[],
  });

  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      country: profile.country,
      city: profile.city,
      religion: profile.religion,
      bio: profile.bio ?? '',
      occupation: profile.occupation ?? '',
      height: profile.height ? String(profile.height) : '',
      educationLevel: profile.educationLevel ?? '',
      smoking: profile.smoking ?? null,
      drinking: profile.drinking ?? null,
      wantKids: profile.wantKids ?? null,
      personality: profile.personality ?? null,
      interests: profile.interests,
      lookingFor: profile.lookingFor,
    });
    setPhotos(profile.photos);
  }, [profile]);

  const cityOptions = useMemo(() => {
    return (CITIES_BY_COUNTRY[form.country] ?? []).map((c) => ({
      value: c,
      label: c,
    }));
  }, [form.country]);

  const toggleInterest = (tag: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(tag)
        ? f.interests.filter((i) => i !== tag)
        : [...f.interests, tag],
    }));
  };

  const toggleMode = (mode: MatchingMode) => {
    setForm((f) => ({
      ...f,
      lookingFor: f.lookingFor.includes(mode)
        ? f.lookingFor.filter((m) => m !== mode)
        : [...f.lookingFor, mode],
    }));
  };

  const handleSave = async () => {
    try {
      await update({
        country: form.country,
        city: form.city,
        religion: form.religion,
        bio: form.bio,
        occupation: form.occupation,
        height: form.height ? parseInt(form.height, 10) : undefined,
        educationLevel: form.educationLevel || undefined,
        smoking: form.smoking ?? undefined,
        drinking: form.drinking ?? undefined,
        wantKids: form.wantKids ?? undefined,
        personality: form.personality ?? undefined,
        interests: form.interests,
        lookingFor: form.lookingFor,
        photos,
      });
      haptics.success();
      toast.show({ message: 'Profile updated.', tone: 'success' });
      router.back();
    } catch (e) {
      toast.show({ message: (e as Error).message, tone: 'error' });
      haptics.error();
    }
  };

  const canSave =
    form.interests.length >= 8 &&
    form.lookingFor.length > 0 &&
    photos.length >= 3;

  if (!profile) return <SafeScreen />;

  return (
    <SafeScreen keyboardAvoiding>
      <ScreenHeader title="Edit profile" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          variant="captionMedium"
          tone="tertiary"
          style={{ marginTop: 8, marginBottom: 10, letterSpacing: 0.6 }}
        >
          PHOTOS
        </Text>
        <PhotoGrid photos={photos} onChange={setPhotos} />

        <Section label="LOOKING FOR">
          <View style={{ gap: 8 }}>
            {MODES.map((m) => (
              <Chip
                key={m.value}
                label={`${m.label} — ${m.description}`}
                selected={form.lookingFor.includes(m.value)}
                onPress={() => toggleMode(m.value)}
                variant="outline"
                size="md"
                style={{
                  alignSelf: 'stretch',
                  height: 'auto',
                  paddingVertical: 14,
                }}
              />
            ))}
          </View>
        </Section>

        <Section label="LOCATION">
          <View style={{ gap: 16 }}>
            <SearchableSelect
              label="Country"
              value={form.country}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              onChange={(v) => setForm((f) => ({ ...f, country: v, city: '' }))}
            />
            <SearchableSelect
              label="City"
              value={form.city}
              options={cityOptions}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              disabled={!form.country}
            />
          </View>
        </Section>

        <Section label="FAITH">
          <SearchableSelect
            label="Religion"
            value={form.religion}
            options={RELIGION_OPTIONS}
            onChange={(v) => setForm((f) => ({ ...f, religion: v as Religion }))}
          />
        </Section>

        <Section label="ABOUT">
          <View style={{ gap: 16 }}>
            <Input
              label="Bio"
              value={form.bio}
              onChangeText={(bio) => setForm((f) => ({ ...f, bio }))}
              multiline
              maxLength={500}
            />
            <Input
              label="Occupation"
              value={form.occupation}
              onChangeText={(v) => setForm((f) => ({ ...f, occupation: v }))}
              maxLength={100}
            />
            <Input
              label="Height (cm)"
              value={form.height}
              onChangeText={(v) => setForm((f) => ({ ...f, height: v }))}
              keyboardType="number-pad"
              maxLength={3}
            />
            <SearchableSelect
              label="Education"
              value={form.educationLevel}
              options={EDUCATION_OPTIONS}
              onChange={(v) =>
                setForm((f) => ({ ...f, educationLevel: v as EducationLevel }))
              }
            />
          </View>
        </Section>

        <Section label="LIFESTYLE">
          <View style={{ gap: 16 }}>
            <Picker
              label="Want kids?"
              value={form.wantKids}
              options={[
                { v: 'yes', l: 'Yes' },
                { v: 'maybe', l: 'Maybe' },
                { v: 'no', l: 'No' },
              ]}
              onChange={(v) => setForm((f) => ({ ...f, wantKids: v as YesNoMaybe }))}
            />
            <Picker
              label="Smoking"
              value={form.smoking}
              options={[
                { v: 'no', l: 'No' },
                { v: 'sometimes', l: 'Sometimes' },
                { v: 'yes', l: 'Yes' },
              ]}
              onChange={(v) =>
                setForm((f) => ({ ...f, smoking: v as YesNoSometimes }))
              }
            />
            <Picker
              label="Drinking"
              value={form.drinking}
              options={[
                { v: 'no', l: 'No' },
                { v: 'sometimes', l: 'Sometimes' },
                { v: 'yes', l: 'Yes' },
              ]}
              onChange={(v) =>
                setForm((f) => ({ ...f, drinking: v as YesNoSometimes }))
              }
            />
            <Picker
              label="Personality"
              value={form.personality}
              options={[
                { v: 'introvert', l: 'Introvert' },
                { v: 'ambivert', l: 'Ambivert' },
                { v: 'extrovert', l: 'Extrovert' },
              ]}
              onChange={(v) =>
                setForm((f) => ({ ...f, personality: v as Personality }))
              }
            />
          </View>
        </Section>

        <Section label="INTERESTS">
          <Text
            variant="caption"
            tone="tertiary"
            style={{ marginBottom: 12 }}
          >
            Pick at least 8. {form.interests.length} selected.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {INTERESTS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={form.interests.includes(tag)}
                onPress={() => toggleInterest(tag)}
                variant="outline"
                size="sm"
              />
            ))}
          </View>
        </Section>

        <View style={{ marginTop: 30 }}>
          <Button
            label="Save changes"
            onPress={handleSave}
            disabled={!canSave}
            loading={isPending}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text
        variant="captionMedium"
        tone="tertiary"
        style={{ marginBottom: 10, letterSpacing: 0.6 }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { v: string; l: string }[];
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
