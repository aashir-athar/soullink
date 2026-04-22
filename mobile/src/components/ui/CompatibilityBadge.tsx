// src/components/ui/CompatibilityBadge.tsx — % pill shown on discover cards.
//
// Tone mapping:
//   >=75  strong (primary)
//   >=55  moderate (neutral)
//   <55   soft (tertiary)
// Psychology: we deliberately don't colour low scores red — avoids
// shaming candidates and preserves user agency to decide.

import { useTheme } from '@/src/contexts/ThemeContext';
import React, { memo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from './Text';

interface Props {
  score: number;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

function CompatibilityBadgeBase({ score, size = 'md', style }: Props) {
  const { theme } = useTheme();
  const padding = size === 'sm' ? 10 : 14;
  const variant = size === 'sm' ? 'micro' : 'captionMedium';

  const tier = score >= 75 ? 'strong' : score >= 55 ? 'moderate' : 'soft';
  const bg =
    tier === 'strong'
      ? theme.colors.text
      : tier === 'moderate'
        ? theme.colors.surfaceElevated
        : theme.colors.surfaceMuted;
  const fg =
    tier === 'strong' ? theme.colors.background : theme.colors.text;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: theme.radii.pill,
          paddingHorizontal: padding,
          paddingVertical: size === 'sm' ? 4 : 6,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.borderSubtle,
        },
        style,
      ]}
    >
      <Text variant={variant} color={fg}>
        {Math.round(score)}% match
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
});

export const CompatibilityBadge = memo(CompatibilityBadgeBase);
