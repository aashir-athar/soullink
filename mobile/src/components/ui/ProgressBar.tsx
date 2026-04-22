// src/components/ui/ProgressBar.tsx — Animated horizontal progress bar.

import React, { memo, useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/src/contexts/ThemeContext';

interface Props {
  progress: number; // 0..1
  height?: number;
  tint?: string;
  style?: ViewStyle;
}

function ProgressBarBase({ progress, height = 4, tint, style }: Props) {
  const { theme } = useTheme();
  const shared = useSharedValue(progress);

  useEffect(() => {
    shared.value = withTiming(progress, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, shared]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, shared.value * 100))}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.surfaceMuted,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          fillStyle,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: tint ?? theme.colors.text,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0 },
});

export const ProgressBar = memo(ProgressBarBase);
