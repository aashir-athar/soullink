// src/components/ui/Input.tsx — Text field with focus / error states.
//
// Psychology: labels stay visible above the input (not floating away on
// focus) — this avoids working memory tax, especially during onboarding.

import { useTheme } from '@/src/contexts/ThemeContext';
import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  rightAdornment?: React.ReactNode;
  leftAdornment?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInput, Props>(function Input(
  {
    label,
    hint,
    error,
    rightAdornment,
    leftAdornment,
    containerStyle,
    style,
    onFocus,
    onBlur,
    multiline,
    ...rest
  },
  ref
) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.text
      : theme.colors.border;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text
          variant="captionMedium"
          tone="secondary"
          style={{ marginBottom: 6, marginLeft: 4 }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
            borderRadius: theme.radii.lg,
            paddingHorizontal: 16,
            minHeight: multiline ? 100 : 52,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingVertical: multiline ? 12 : 0,
          },
        ]}
      >
        {leftAdornment ? (
          <View style={{ marginRight: 10 }}>{leftAdornment}</View>
        ) : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              ...theme.typography.bodyLarge,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            style,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightAdornment ? (
          <View style={{ marginLeft: 10 }}>{rightAdornment}</View>
        ) : null}
      </View>

      {error ? (
        <Text
          variant="caption"
          tone="error"
          style={{ marginTop: 6, marginLeft: 4 }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          variant="caption"
          tone="tertiary"
          style={{ marginTop: 6, marginLeft: 4 }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  field: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});
