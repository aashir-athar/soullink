// src/components/ui/GlassSurface.tsx — Cross-platform "glass" container.
//
// CRITICAL PLATFORM DIFFERENCE
//   iOS: uses expo-blur's BlurView with iOS system materials. This is
//        hardware-accelerated and is the only way to get true iOS 26
//        Liquid Glass fidelity.
//   Android: BlurView on Android is historically expensive and janky on
//        low-end devices. We render a solid translucent surface with a
//        subtle border instead. The perceptual gap is tiny and the perf
//        gap is huge.
//
// Rule: use this surface sparingly — bottom tab bar, headers over media,
// match overlay. Not as a general container.

import { BlurView } from 'expo-blur';
import React, { memo, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/contexts/ThemeContext';

interface Props {
  children: ReactNode;
  intensity?: number; // 0..100 (iOS)
  style?: ViewStyle;
  /** When true, the glass fills its parent absolutely. */
  absolute?: boolean;
  /** Border radius applied to the clipping layer. */
  radius?: number;
}

function GlassSurfaceBase({
  children,
  intensity = 60,
  style,
  absolute = false,
  radius,
}: Props) {
  const { theme, mode } = useTheme();

  const baseStyle: ViewStyle = {
    borderRadius: radius ?? 0,
    overflow: 'hidden',
    ...(absolute ? (StyleSheet.absoluteFillObject as ViewStyle) : {}),
  };

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={mode === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        style={[baseStyle, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Android / others: solid translucent fill
  return (
    <View
      style={[
        baseStyle,
        {
          backgroundColor: mode === 'dark'
            ? 'rgba(22, 21, 19, 0.92)'
            : 'rgba(255, 255, 255, 0.94)',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.borderSubtle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export const GlassSurface = memo(GlassSurfaceBase);
