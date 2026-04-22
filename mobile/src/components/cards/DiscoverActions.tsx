// src/components/cards/DiscoverActions.tsx — Action bar under the swipe deck.
//
// Explicit buttons complement gestures: some users feel safer tapping
// deliberately than flinging. The compliment button stands out in warm
// coral to signal scarcity (5/day) without dark patterns.

import { IconButton } from '@/src/components/ui/IconButton';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  onPass: () => void;
  onLike: () => void;
  onCompliment: () => void;
  disabled?: boolean;
  canCompliment?: boolean;
}

function DiscoverActionsBase({
  onPass,
  onLike,
  onCompliment,
  disabled,
  canCompliment = true,
}: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <IconButton
        icon={<Ionicons name="close" size={26} color={theme.colors.text} />}
        onPress={onPass}
        size={60}
        accessibilityLabel="Pass"
        disabled={disabled}
      />
      <IconButton
        icon={<Ionicons name="sparkles-outline" size={22} color="#FFFFFF" />}
        onPress={onCompliment}
        size={52}
        variant="solid"
        accent={theme.colors.primary}
        accessibilityLabel="Send compliment"
        disabled={disabled || !canCompliment}
      />
      <IconButton
        icon={<Ionicons name="heart" size={28} color={theme.colors.success} />}
        onPress={onLike}
        size={60}
        accessibilityLabel="Like"
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
});

export const DiscoverActions = memo(DiscoverActionsBase);
