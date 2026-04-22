// src/components/chat/ChatBubble.tsx — Single message bubble.

import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import type { Message } from '@/src/types';
import { chatTime } from '@/src/utils/format';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  message: Message;
  mine: boolean;
  showTime: boolean;
}

function ChatBubbleBase({ message, mine, showTime }: Props) {
  const { theme } = useTheme();

  const bg = mine ? theme.colors.text : theme.colors.surfaceMuted;
  const fg = mine ? theme.colors.background : theme.colors.text;

  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: mine ? 'flex-end' : 'flex-start',
          marginTop: showTime ? 14 : 3,
        },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bg,
            borderTopLeftRadius: mine ? 18 : 4,
            borderTopRightRadius: mine ? 4 : 18,
          },
        ]}
      >
        <Text variant="bodyLarge" color={fg}>
          {message.content}
        </Text>
      </View>
      {showTime ? (
        <Text
          variant="micro"
          tone="tertiary"
          style={[
            styles.time,
            { [mine ? 'right' : 'left']: 4 } as never,
          ]}
        >
          {chatTime(message.createdAt)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  time: {
    position: 'absolute',
    bottom: -14,
  },
});

export const ChatBubble = memo(ChatBubbleBase);
