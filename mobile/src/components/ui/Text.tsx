// src/components/ui/Text.tsx — Typed text primitive over theme tokens.

import type { Theme } from '@/src/constants/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import React, { memo } from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

type Variant = keyof Theme['typography'];
type Tone = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'onPrimary' | 'accent' | 'error';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  color?: string;
}

function toneColor(tone: Tone, colors: Theme['colors']): string {
  switch (tone) {
    case 'primary':
      return colors.text;
    case 'secondary':
      return colors.textSecondary;
    case 'tertiary':
      return colors.textTertiary;
    case 'inverse':
      return colors.textInverse;
    case 'onPrimary':
      return colors.textOnPrimary;
    case 'accent':
      return colors.primary;
    case 'error':
      return colors.error;
  }
}

function TextBase({
  variant = 'body',
  tone = 'primary',
  align,
  weight,
  color,
  style,
  children,
  ...rest
}: Props) {
  const { theme } = useTheme();
  const v = theme.typography[variant];

  return (
    <RNText
      {...rest}
      style={[
        v,
        {
          color: color ?? toneColor(tone, theme.colors),
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      allowFontScaling
    >
      {children}
    </RNText>
  );
}

export const Text = memo(TextBase);
