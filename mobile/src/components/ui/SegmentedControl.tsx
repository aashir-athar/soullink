// src/components/ui/SegmentedControl.tsx — Animated segmented selector.
//
// Used for the Friendship / Lovers / Marriage tabs inside Discover.
// Psychology: one-at-a-time selection reinforces that the user is
// entering a specific intent state — reduces mode-blending anxiety.

import React, { memo, useEffect } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
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

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Optional accent colour for the active pill (used for mode-specific hues). */
  accent?: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

function SegmentedControlInner<T extends string>({
  options,
  value,
  onChange,
  style,
}: Props<T>) {
  const { theme } = useTheme();
  const [width, setWidth] = React.useState(0);
  const itemWidth = width > 0 ? width / options.length : 0;

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * itemWidth, {
      mass: 0.6,
      damping: 18,
      stiffness: 180,
    });
  }, [activeIndex, itemWidth, translateX]);

  const activeAccent = options[activeIndex]?.accent ?? theme.colors.text;

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: itemWidth,
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.pill,
          padding: 4,
        },
        style,
      ]}
    >
      {itemWidth > 0 ? (
        <Animated.View
          style={[
            styles.pill,
            pillStyle,
            {
              backgroundColor: activeAccent,
              borderRadius: theme.radii.pill,
            },
          ]}
        />
      ) : null}
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              haptics.selection();
              onChange(opt.value);
            }}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={opt.label}
          >
            <Text
              variant="bodyMedium"
              color={
                isActive
                  ? opt.accent
                    ? theme.colors.textOnPrimary
                    : theme.colors.background
                  : theme.colors.text
              }
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
  },
  item: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const SegmentedControl = memo(SegmentedControlInner) as typeof SegmentedControlInner;