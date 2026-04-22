// src/components/ui/Button.tsx — Primary interactive control.
//
// Variants: primary | secondary | ghost | destructive
// Sizes: sm | md | lg
//
// Psychology:
//  - Primary uses brand coral — warm, inviting
//  - Light haptic confirms the press before the next screen resolves:
//    pre-emptive sensory feedback reduces perceived latency
//  - Disabled state is visible but never invisible — users retain sense
//    of "the system is waiting on me", not "broken"

import React, { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/src/contexts/ThemeContext';
import { haptics } from '@/src/utils/haptics';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  hapticOnPress?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ButtonBase({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  disabled,
  style,
  hapticOnPress = true,
  ...rest
}: Props) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { mass: 0.5, damping: 14, stiffness: 280 });
  }, [scale]);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { mass: 0.5, damping: 14, stiffness: 260 });
  }, [scale]);

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (e) => {
      if (hapticOnPress) haptics.light();
      onPress?.(e);
    },
    [hapticOnPress, onPress]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const height = size === 'sm' ? 40 : size === 'md' ? 52 : 60;
  const paddingH = size === 'sm' ? 16 : size === 'md' ? 22 : 28;
  const radius = theme.radii.pill;

  const variantStyle = (() => {
    const isDisabled = disabled || loading;
    const opacity = isDisabled ? 0.55 : 1;
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.text, // ink/snow — high-contrast, premium
          fg: theme.colors.background,
          border: 'transparent',
          opacity,
        };
      case 'secondary':
        return {
          bg: theme.colors.surfaceMuted,
          fg: theme.colors.text,
          border: theme.colors.borderSubtle,
          opacity,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          fg: theme.colors.text,
          border: 'transparent',
          opacity,
        };
      case 'destructive':
        return {
          bg: theme.colors.error,
          fg: theme.colors.textOnPrimary,
          border: 'transparent',
          opacity,
        };
    }
  })();

  return (
    <AnimatedPressable
      {...rest}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={label}
      style={[
        styles.base,
        {
          height,
          paddingHorizontal: paddingH,
          borderRadius: radius,
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          opacity: variantStyle.opacity,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.fg} />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text
            variant="button"
            color={variantStyle.fg}
            style={{ letterSpacing: 0.1 }}
          >
            {label}
          </Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: { marginHorizontal: 2 },
});

export const Button = memo(ButtonBase);