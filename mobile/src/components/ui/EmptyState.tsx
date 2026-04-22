// src/components/ui/EmptyState.tsx — Friendly empty/error state.

import { useTheme } from '@/src/contexts/ThemeContext';
import React, { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

function EmptyStateBase({ icon, title, description, action }: Props) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      {icon ? (
        <View
          style={{
            marginBottom: theme.spacing.lg,
            opacity: 0.9,
          }}
        >
          {icon}
        </View>
      ) : null}
      <Text variant="title3" align="center" style={{ marginBottom: 8 }}>
        {title}
      </Text>
      {description ? (
        <Text
          variant="body"
          tone="secondary"
          align="center"
          style={{ maxWidth: 280 }}
        >
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 24 }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});

export const EmptyState = memo(EmptyStateBase);
