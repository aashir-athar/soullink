// src/components/ui/BottomSheet.tsx — Lightweight custom bottom sheet.
//
// We avoid pulling a full sheet library to keep the bundle small and the
// animation fully under our control (Reanimated v4 worklets).
//
// Psychology: gentle spring entrance (mass 0.6) feels non-demanding —
// the sheet "arrives" rather than "jumps up" — reducing startle response.

import React, { memo, useCallback, useEffect, type ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: number | 'auto';
}

function BottomSheetBase({ visible, onClose, children, height }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const resolvedHeight =
    height === 'auto' || height === undefined
      ? Math.min(screenH * 0.82, screenH - 60)
      : height;

  const translateY = useSharedValue(resolvedHeight);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        mass: 0.6,
        damping: 22,
        stiffness: 220,
      });
      opacity.value = withTiming(1, { duration: 220 });
    } else {
      translateY.value = withTiming(resolvedHeight, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, resolvedHeight, translateY, opacity]);

  const close = useCallback(() => onClose(), [onClose]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        translateY.value = withTiming(resolvedHeight, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(0, { duration: 180 });
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, {
          mass: 0.6,
          damping: 22,
          stiffness: 220,
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.scrim },
            scrimStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surfaceElevated,
                height: resolvedHeight,
                borderTopLeftRadius: theme.radii['3xl'],
                borderTopRightRadius: theme.radii['3xl'],
                paddingBottom: insets.bottom + 8,
              },
              sheetStyle,
            ]}
          >
            <View style={styles.grabRow}>
              <View
                style={[
                  styles.grab,
                  { backgroundColor: theme.colors.borderStrong },
                ]}
              />
            </View>
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  grabRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  grab: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

export const BottomSheet = memo(BottomSheetBase);
