// app/(onboarding)/step-1.tsx — Name, gender, date of birth.
//
// Why these three together:
//   All three are locked-after-signup identity fields. Grouping them into
//   one step signals to the user: "this is the permanent core, take care."
//   The rest of onboarding can feel more exploratory.

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { StepShell } from '@/src/components/onboarding/StepShell';
import { Chip } from '@/src/components/ui/Chip';
import { Input } from '@/src/components/ui/Input';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useOnboardingStore } from '@/src/store/useOnboardingStore';
import { ageFromDob } from '@/src/utils/format';

const STEPS = 6;

export default function Step1() {
  const { theme } = useTheme();
  const router = useRouter();
  const { draft, update } = useOnboardingStore();
  const [showPicker, setShowPicker] = useState(false);
  

  const setName = useCallback((fullName: string) => update({ fullName }), [update]);
  const setGender = useCallback(
    (gender: 'male' | 'female') => update({ gender }),
    [update]
  );

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (date) update({ dateOfBirth: date.toISOString() });
  };

  const age = draft.dateOfBirth ? ageFromDob(draft.dateOfBirth) : null;
  const nameOk = draft.fullName.trim().length >= 2;
  const genderOk = !!draft.gender;
  const dobOk = age !== null && age >= 18;

  const dobLabel = draft.dateOfBirth
    ? new Date(draft.dateOfBirth).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Select your date of birth';

  const defaultDate =
    draft.dateOfBirth ? new Date(draft.dateOfBirth) : new Date(2000, 0, 1);

  return (
    <SafeScreen keyboardAvoiding>
      <ScreenHeader title="" />
      <StepShell
        title="A little about you"
        description="This is the permanent core of your profile. Name, gender, and age can't change later — so take a moment."
        stepIndex={0}
        totalSteps={STEPS}
        canContinue={nameOk && genderOk && dobOk}
        onContinue={() => router.push('/(onboarding)/step-2')}
        footerHint="You must be 18 or older to use Soullink."
      >
        <View style={{ gap: 24 }}>
          <Input
            label="Full name"
            value={draft.fullName}
            onChangeText={setName}
            placeholder="Your full name"
            autoCapitalize="words"
            autoComplete="name"
          />

          <View>
            <Text
              variant="captionMedium"
              tone="secondary"
              style={{ marginBottom: 8, marginLeft: 4 }}
            >
              Gender
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Chip
                label="Woman"
                selected={draft.gender === 'female'}
                onPress={() => setGender('female')}
                variant="outline"
              />
              <Chip
                label="Man"
                selected={draft.gender === 'male'}
                onPress={() => setGender('male')}
                variant="outline"
              />
            </View>
            <Text
              variant="caption"
              tone="tertiary"
              style={{ marginTop: 10, marginLeft: 4 }}
            >
              Soullink uses strict gender rules for Relationship and Marriage
              modes. This can't be changed later.
            </Text>
          </View>

          <View>
            <Text
              variant="captionMedium"
              tone="secondary"
              style={{ marginBottom: 8, marginLeft: 4 }}
            >
              Date of birth
            </Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={[
                styles.dobField,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.lg,
                },
              ]}
            >
              <Text
                variant="bodyLarge"
                tone={draft.dateOfBirth ? 'primary' : 'tertiary'}
              >
                {dobLabel}
              </Text>
            </Pressable>
            {age !== null ? (
              <Text
                variant="caption"
                tone={age >= 18 ? 'tertiary' : 'error'}
                style={{ marginTop: 8, marginLeft: 4 }}
              >
                {age >= 18
                  ? `You are ${age} years old.`
                  : 'You must be 18 or older to use Soullink.'}
              </Text>
            ) : null}
          </View>

          {showPicker ? (
            <DateTimePicker
              value={defaultDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
              onChange={onDateChange}
            />
          ) : null}

          {Platform.OS === 'ios' && showPicker ? (
            <Pressable
              onPress={() => setShowPicker(false)}
              style={{ alignSelf: 'center', padding: 10 }}
            >
              <Text variant="bodyMedium" tone="accent">
                Done
              </Text>
            </Pressable>
          ) : null}
        </View>
      </StepShell>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  dobField: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
