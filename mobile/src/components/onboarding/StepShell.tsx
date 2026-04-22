// src/components/onboarding/StepShell.tsx — Common chrome for each
// onboarding step: title, description, scrollable body, persistent footer.

import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import React, { memo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface Props {
  children: ReactNode;
  title: string;
  description?: string;
  stepIndex: number;
  totalSteps: number;
  onContinue: () => void;
  continueLabel?: string;
  canContinue: boolean;
  loading?: boolean;
  footerHint?: string;
}

function StepShellBase({
  children,
  title,
  description,
  stepIndex,
  totalSteps,
  onContinue,
  continueLabel = 'Continue',
  canContinue,
  loading,
  footerHint,
}: Props) {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.progressRow}>
        <ProgressBar progress={(stepIndex + 1) / totalSteps} />
        <Text
          variant="micro"
          tone="tertiary"
          style={{ marginTop: 8, letterSpacing: 0.4 }}
        >
          STEP {stepIndex + 1} OF {totalSteps}
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 32,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="title1" style={{ marginBottom: 10 }}>
          {title}
        </Text>
        {description ? (
          <Text variant="bodyLarge" tone="secondary" style={{ marginBottom: 28 }}>
            {description}
          </Text>
        ) : (
          <View style={{ height: 16 }} />
        )}
        {children}
      </ScrollView>

      <View style={{ paddingTop: 12, paddingBottom: 8 }}>
        {footerHint ? (
          <Text
            variant="caption"
            tone="tertiary"
            align="center"
            style={{ marginBottom: 10 }}
          >
            {footerHint}
          </Text>
        ) : null}
        <Button
          label={continueLabel}
          onPress={onContinue}
          disabled={!canContinue}
          loading={loading}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    paddingTop: 6,
    paddingBottom: 20,
  },
});

export const StepShell = memo(StepShellBase);
