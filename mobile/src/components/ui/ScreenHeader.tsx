// src/components/ui/ScreenHeader.tsx — Consistent top nav bar.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/contexts/ThemeContext';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface Props {
  title?: string;
  leftIcon?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
  style?: ViewStyle;
}

function ScreenHeaderBase({
  title,
  leftIcon,
  onBack,
  showBack = true,
  right,
  style,
}: Props) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.side}>
        {showBack ? (
          <IconButton
            icon={
              leftIcon ?? (
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={theme.colors.text}
                />
              )
            }
            variant="ghost"
            accessibilityLabel="Go back"
            onPress={() => {
              if (onBack) onBack();
              else if (router.canGoBack()) router.back();
            }}
          />
        ) : null}
      </View>

      <View style={styles.centre}>
        {title ? (
          <Text variant="title3" align="center" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  side: { width: 56, justifyContent: 'center' },
  centre: { flex: 1, justifyContent: 'center' },
});

export const ScreenHeader = memo(ScreenHeaderBase);
