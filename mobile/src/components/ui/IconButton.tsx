// src/components/ui/IconButton.tsx — Circular icon-only pressable.

import { useTheme } from '@/src/contexts/ThemeContext';
import { haptics } from '@/src/utils/haptics';
import React, { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  icon: ReactNode;
  onPress?: () => void;
  size?: number;
  variant?: 'solid' | 'ghost' | 'glass';
  accessibilityLabel?: string;
  style?: ViewStyle;
  disabled?: boolean;
  accent?: string;
}

function IconButtonBase({
  icon,
  onPress,
  size = 44,
  variant = 'solid',
  accessibilityLabel,
  style,
  disabled,
  accent,
}: Props) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const bg =
    variant === 'solid'
      ? accent ?? theme.colors.surface
      : variant === 'glass'
        ? theme.colors.glassTint
        : 'transparent';

  const border =
    variant === 'solid' || variant === 'glass' ? theme.colors.borderSubtle : 'transparent';

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        if (disabled) return;
        haptics.light();
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, { mass: 0.4, damping: 12, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { mass: 0.4, damping: 12, stiffness: 240 });
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'ghost' ? 0 : StyleSheet.hairlineWidth,
          opacity: disabled ? 0.5 : 1,
        },
        animStyle,
        style,
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});

export const IconButton = memo(IconButtonBase);
