// src/components/ui/Avatar.tsx — Circular avatar with graceful fallback.

import { useTheme } from '@/src/contexts/ThemeContext';
import { Image } from 'expo-image';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

interface Props {
  uri?: string;
  size?: number;
  name?: string;
  ring?: boolean;
  ringColor?: string;
}

function initials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

function AvatarBase({ uri, size = 48, name, ring, ringColor }: Props) {
  const { theme } = useTheme();
  const s = size;
  const ringPad = ring ? 3 : 0;

  return (
    <View
      style={{
        width: s + ringPad * 2,
        height: s + ringPad * 2,
        borderRadius: (s + ringPad * 2) / 2,
        padding: ringPad,
        backgroundColor: ring ? ringColor ?? theme.colors.primary : 'transparent',
      }}
    >
      <View
        style={{
          width: s,
          height: s,
          borderRadius: s / 2,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        ) : (
          <Text
            variant="title3"
            tone="secondary"
            style={{ fontSize: Math.max(12, s * 0.36) }}
          >
            {initials(name)}
          </Text>
        )}
      </View>
    </View>
  );
}

export const Avatar = memo(AvatarBase);
