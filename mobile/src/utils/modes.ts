// src/utils/modes.ts — Helpers that map a matching mode to UI tokens.

import type { ThemeColors } from '@/src/constants/theme';
import type { MatchingMode } from '@/src/types';

export function modeColor(
  mode: MatchingMode,
  colors: ThemeColors
): { base: string; soft: string } {
  switch (mode) {
    case 'friendship':
      return { base: colors.friendship, soft: colors.friendshipSoft };
    case 'relationship':
      return { base: colors.relationship, soft: colors.relationshipSoft };
    case 'marriage':
      return { base: colors.marriage, soft: colors.marriageSoft };
  }
}

export function modeLabel(mode: MatchingMode): string {
  switch (mode) {
    case 'friendship':
      return 'Friendship';
    case 'relationship':
      return 'Lovers';
    case 'marriage':
      return 'Marriage';
  }
}
