// src/components/ui/Card.tsx — Generic content container.

import { useTheme } from '@/src/contexts/ThemeContext';
import React, { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: number;
  radius?: number;
}

function CardBase({
  children,
  onPress,
  style,
  elevated = false,
  padding,
  radius,
}: Props) {
  const { theme } = useTheme();

  const base: ViewStyle = {
    backgroundColor: elevated
      ? theme.colors.surfaceElevated
      : theme.colors.surface,
    borderRadius: radius ?? theme.radii.xl,
    padding: padding ?? theme.spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    ...(elevated ? theme.elevation.low : {}),
    shadowColor: theme.mode === 'dark' ? '#000000' : '#1A1817',
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, style, pressed && { opacity: 0.9 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}

export const Card = memo(CardBase);
