// src/constants/theme.ts — Soullink design tokens
//
// Design language: 2026 minimalist, emotionally warm, premium.
// Dark mode is the default emotional mode (lower arousal, intimacy cue),
// light mode preserves Soullink's warm ivory palette.
//
// Colour choices grounded in psychology:
//   - Warm neutral (ivory/charcoal) as base — reduces evaluative anxiety
//   - Soft coral accent — associated with warmth + human connection
//   - Restrained palette — reduces cognitive load in onboarding
//   - Green reserved for match/success — positive reinforcement

import type { TextStyle } from 'react-native';

type FontWeight = TextStyle['fontWeight'];

const palette = {
  // Brand
  coral: '#E86A6A',
  coralSoft: '#F4A5A5',
  coralPressed: '#C95555',

  // Accents
  gold: '#C8A464',
  sage: '#7BAE88',
  sky: '#6FA8DC',

  // Neutrals - light
  ivory: '#FBF8F4',
  bone: '#F4F0EA',
  sand: '#EAE3D9',
  ash: '#B8B0A6',
  charcoal: '#2A2725',
  ink: '#1A1817',

  // Neutrals - dark
  midnight: '#0E0D0C',
  obsidian: '#161513',
  slate: '#22201D',
  fog: '#3A3733',
  mist: '#6F6A64',
  pearl: '#D8D3CA',
  snow: '#F2EEE7',

  // Semantic
  success: '#5AA572',
  warning: '#E0A654',
  error: '#D9634C',
  info: '#6A9BCE',

  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
} as const;

/** Common structural tokens shared across themes. */
const shared = {
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 56,
    '6xl': 72,
  },
  radii: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    card: 28,
    pill: 999,
  },
  typography: {
    // Display — hero moments only
    display: {
      fontSize: 40,
      lineHeight: 46,
      letterSpacing: -1.1,
      fontWeight: '700' as FontWeight,
    },
    // Titles
    title1: {
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.6,
      fontWeight: '700' as FontWeight,
    },
    title2: {
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.3,
      fontWeight: '700' as FontWeight,
    },
    title3: {
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.2,
      fontWeight: '600' as FontWeight,
    },
    // Body
    bodyLarge: {
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: -0.1,
      fontWeight: '400' as FontWeight,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0,
      fontWeight: '400' as FontWeight,
    },
    bodyMedium: {
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0,
      fontWeight: '500' as FontWeight,
    },
    // Small
    caption: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.1,
      fontWeight: '400' as FontWeight,
    },
    captionMedium: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.1,
      fontWeight: '500' as FontWeight,
    },
    micro: {
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.3,
      fontWeight: '500' as FontWeight,
    },
    button: {
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0.1,
      fontWeight: '600' as FontWeight,
    },
  },
  motion: {
    durations: {
      instant: 80,
      fast: 160,
      base: 240,
      slow: 380,
      slower: 600,
    },
    // Psychology: ease-out for entrances (natural deceleration = calm arrival).
    // Symmetric curve for matches (emphasis + celebration).
    easings: {
      easeOut: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
      easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
      emphasized: [0.3, 0.0, 0.1, 1] as [number, number, number, number],
    },
  },
  elevation: {
    // Subtle depth — never drop-shadow maximalism
    none: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    low: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    medium: {
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 6,
    },
    high: {
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 12,
    },
  },
} as const;

/** Light theme — warm ivory, soft coral, ink text. */
export const lightTheme = {
  mode: 'light' as const,
  colors: {
    // Surfaces
    background: palette.ivory,
    surface: palette.white,
    surfaceElevated: palette.white,
    surfaceMuted: palette.bone,
    surfaceOverlay: 'rgba(26, 24, 23, 0.45)',
    scrim: 'rgba(10, 10, 10, 0.7)',

    // Borders & separators
    border: palette.sand,
    borderSubtle: 'rgba(26, 24, 23, 0.06)',
    borderStrong: 'rgba(26, 24, 23, 0.12)',

    // Text
    text: palette.ink,
    textSecondary: palette.charcoal,
    textTertiary: palette.mist,
    textInverse: palette.snow,
    textOnPrimary: palette.white,

    // Brand
    primary: palette.coral,
    primaryPressed: palette.coralPressed,
    primarySoft: 'rgba(232, 106, 106, 0.12)',
    primarySubtle: 'rgba(232, 106, 106, 0.06)',

    // Mode-specific hues (for the 3 tabs — Friendship / Lover / Marriage)
    friendship: palette.sage,
    friendshipSoft: 'rgba(123, 174, 136, 0.14)',
    relationship: palette.coral,
    relationshipSoft: 'rgba(232, 106, 106, 0.14)',
    marriage: palette.gold,
    marriageSoft: 'rgba(200, 164, 100, 0.14)',

    // Semantic
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,

    // Glass
    glassTint: 'rgba(255, 255, 255, 0.6)',
    glassBorder: 'rgba(26, 24, 23, 0.08)',

    transparent: palette.transparent,
  },
  ...shared,
};

/** Dark theme — obsidian with warm coral accent. */
export const darkTheme = {
  mode: 'dark' as const,
  colors: {
    background: palette.midnight,
    surface: palette.obsidian,
    surfaceElevated: palette.slate,
    surfaceMuted: palette.slate,
    surfaceOverlay: 'rgba(14, 13, 12, 0.7)',
    scrim: 'rgba(0, 0, 0, 0.85)',

    border: palette.fog,
    borderSubtle: 'rgba(242, 238, 231, 0.06)',
    borderStrong: 'rgba(242, 238, 231, 0.14)',

    text: palette.snow,
    textSecondary: palette.pearl,
    textTertiary: palette.mist,
    textInverse: palette.ink,
    textOnPrimary: palette.white,

    primary: palette.coral,
    primaryPressed: palette.coralPressed,
    primarySoft: 'rgba(232, 106, 106, 0.18)',
    primarySubtle: 'rgba(232, 106, 106, 0.10)',

    friendship: palette.sage,
    friendshipSoft: 'rgba(123, 174, 136, 0.18)',
    relationship: palette.coral,
    relationshipSoft: 'rgba(232, 106, 106, 0.18)',
    marriage: palette.gold,
    marriageSoft: 'rgba(200, 164, 100, 0.18)',

    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,

    glassTint: 'rgba(22, 21, 19, 0.55)',
    glassBorder: 'rgba(242, 238, 231, 0.08)',

    transparent: palette.transparent,
  },
  ...shared,
};

export type Theme = typeof lightTheme;
export type ThemeColors = Theme['colors'];
export type ThemeMode = 'light' | 'dark';

export { palette };
