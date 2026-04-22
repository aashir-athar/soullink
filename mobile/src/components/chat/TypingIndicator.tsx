// src/components/chat/TypingIndicator.tsx — Animated 3-dot typing bubble.

import { useTheme } from '@/src/contexts/ThemeContext';
import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Dot({ delay }: { delay: number }) {
  const { theme } = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + t.value * 0.65,
    transform: [{ translateY: -t.value * 3 }],
  }));
  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: theme.colors.textSecondary },
        style,
      ]}
    />
  );
}

function TypingIndicatorBase() {
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      >
        <Dot delay={0} />
        <Dot delay={130} />
        <Dot delay={260} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginTop: 6,
    flexDirection: 'row',
  },
  bubble: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    gap: 5,
    alignItems: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

export const TypingIndicator = memo(TypingIndicatorBase);
