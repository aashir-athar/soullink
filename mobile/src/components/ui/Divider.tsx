// src/components/ui/Divider.tsx — Thin hairline divider, theme-aware.

import { useTheme } from '@/src/contexts/ThemeContext';
import React, { memo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface Props {
  style?: ViewStyle;
  inset?: number;
}

function DividerBase({ style, inset = 0 }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.borderSubtle,
          marginLeft: inset,
        },
        style,
      ]}
    />
  );
}

export const Divider = memo(DividerBase);

export function Spacer({ size = 16 }: { size?: number }) {
  return <View style={{ height: size, width: size }} />;
}
