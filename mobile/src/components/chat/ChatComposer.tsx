// src/components/chat/ChatComposer.tsx — Text-only chat input row.

import { Ionicons } from '@expo/vector-icons';
import React, { memo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/src/contexts/ThemeContext';
import { haptics } from '@/src/utils/haptics';

interface Props {
  onSend: (text: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

function ChatComposerBase({ onSend, onTypingChange, disabled }: Props) {
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  const typingRef = useRef(false);
  const stopTypingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (text: string) => {
    setValue(text);
    if (!typingRef.current && text.length > 0) {
      typingRef.current = true;
      onTypingChange?.(true);
    }
    if (stopTypingTimeout.current) clearTimeout(stopTypingTimeout.current);
    stopTypingTimeout.current = setTimeout(() => {
      typingRef.current = false;
      onTypingChange?.(false);
    }, 1500);
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    haptics.light();
    onSend(trimmed);
    setValue('');
    typingRef.current = false;
    onTypingChange?.(false);
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderRadius: theme.radii.xl,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder="Write something thoughtful..."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={1000}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              ...theme.typography.bodyLarge,
            },
          ]}
          editable={!disabled}
        />
      </View>
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[
          styles.sendBtn,
          {
            backgroundColor: canSend ? theme.colors.text : theme.colors.surfaceMuted,
            opacity: canSend ? 1 : 0.6,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Ionicons
          name="arrow-up"
          size={20}
          color={canSend ? theme.colors.background : theme.colors.textTertiary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  field: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 140,
  },
  input: {
    padding: 0,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const ChatComposer = memo(ChatComposerBase);
