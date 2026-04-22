// src/components/ui/Chip.tsx — Pill-shaped selectable tag.
//
// Used for interests, "looking for" modes, filter criteria.

import { useTheme } from '@/src/contexts/ThemeContext';
import { haptics } from '@/src/utils/haptics';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'accent' | 'outline';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

function ChipBase({
  label,
  selected = false,
  onPress,
  disabled = false,
  variant = 'default',
  size = 'md',
  style,
}: Props) {
  const { theme } = useTheme();

  const bg = selected
    ? variant === 'accent'
      ? theme.colors.primary
      : theme.colors.text
    : variant === 'outline'
      ? 'transparent'
      : theme.colors.surfaceMuted;

  const fg = selected
    ? variant === 'accent'
      ? theme.colors.textOnPrimary
      : theme.colors.background
    : theme.colors.text;

  const borderColor = selected
    ? 'transparent'
    : variant === 'outline'
      ? theme.colors.borderStrong
      : 'transparent';

  const height = size === 'sm' ? 32 : 40;
  const padH = size === 'sm' ? 12 : 16;

  return (
    <Pressable
      onPress={() => {
        if (disabled || !onPress) return;
        haptics.selection();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth : 0,
          borderRadius: theme.radii.pill,
          height,
          paddingHorizontal: padH,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        <Text
          variant={size === 'sm' ? 'caption' : 'bodyMedium'}
          color={fg}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { alignItems: 'center', justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center' },
});

export const Chip = memo(ChipBase);
