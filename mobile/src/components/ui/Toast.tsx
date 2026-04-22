// src/components/ui/Toast.tsx — Tiny global toast via context.
//
// Used for lightweight confirmations ("Photo added", "Report sent").
// Psychology: immediate text confirmation + haptic closes the action loop
// — users stop waiting for "did that work?".

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/contexts/ThemeContext';
import { Text } from './Text';

type ToastTone = 'default' | 'success' | 'error';

interface ToastConfig {
  message: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastContextValue {
  show: (cfg: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastConfig | null>(null);
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    translateY.value = withTiming(-80, { duration: 220 });
    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(setCurrent)(null);
    });
  }, [translateY, opacity]);

  const show = useCallback(
    (cfg: ToastConfig) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCurrent(cfg);
      translateY.value = withSpring(0, {
        mass: 0.5,
        damping: 18,
        stiffness: 220,
      });
      opacity.value = withTiming(1, { duration: 180 });
      timerRef.current = setTimeout(hide, cfg.duration ?? 2400);
    },
    [hide, opacity, translateY]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastSurface tone={current?.tone} message={current?.message} translateY={translateY} opacity={opacity} />
    </ToastContext.Provider>
  );
}

function ToastSurface({
  tone = 'default',
  message,
  translateY,
  opacity,
}: {
  tone?: ToastTone;
  message?: string;
  translateY: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const bg =
    tone === 'success'
      ? theme.colors.success
      : tone === 'error'
        ? theme.colors.error
        : theme.colors.text;

  const fg = tone === 'default' ? theme.colors.background : '#FFFFFF';

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          backgroundColor: bg,
          borderRadius: theme.radii.pill,
          top: insets.top + 12,
          maxWidth: width - 48,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            },
            android: { elevation: 4 },
          }),
        },
        style,
      ]}
    >
      <Text variant="bodyMedium" color={fg} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
});

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
