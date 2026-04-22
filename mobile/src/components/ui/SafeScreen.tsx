// src/components/ui/SafeScreen.tsx — Root screen container.
//
// Handles:
//  - Safe-area insets (iOS notch + Android edge-to-edge)
//  - Theme background
//  - Optional keyboard avoidance for screens with text inputs
//  - Status bar style matched to theme
//
// Psychology note: consistent padding rhythm at screen level reduces the
// cognitive "am I in the right app?" overhead — everything feels from one
// product, not stitched together.

import { useTheme } from '@/src/contexts/ThemeContext';
import React, { memo, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  /** Apply horizontal padding at screen level (default true). */
  padded?: boolean;
  /** Wrap in KeyboardAvoidingView. */
  keyboardAvoiding?: boolean;
  /** Allow content to extend under the top safe area (hero screens). */
  edgeToEdgeTop?: boolean;
  /** Allow content to extend under the bottom safe area. */
  edgeToEdgeBottom?: boolean;
  style?: ViewStyle;
  /** Override background colour. */
  backgroundColor?: string;
}

function SafeScreenBase({
  children,
  padded = true,
  keyboardAvoiding = false,
  edgeToEdgeTop = false,
  edgeToEdgeBottom = false,
  style,
  backgroundColor,
}: Props) {
  const { theme, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const bg = backgroundColor ?? theme.colors.background;

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingTop: edgeToEdgeTop ? 0 : insets.top,
          paddingBottom: edgeToEdgeBottom ? 0 : insets.bottom,
          paddingHorizontal: padded ? theme.spacing.xl : 0,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: bg }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export const SafeScreen = memo(SafeScreenBase);
