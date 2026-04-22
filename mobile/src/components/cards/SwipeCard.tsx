// src/components/cards/SwipeCard.tsx — Draggable discovery card.
//
// Performance notes (critical for low-end Android):
//   - All gesture-driven animations run via Reanimated worklets on the UI
//     thread — zero JS-bridge calls during a swipe.
//   - expo-image with memory-disk cache keeps re-renders cheap as the
//     deck advances.
//   - We render a max of 2 cards at a time in the parent (see DiscoverDeck).
//
// Psychology:
//   - Horizontal fling for like/pass mirrors a well-learned gesture.
//   - Rotation on drag is subtle (~8°) — enough to feel embodied without
//     suggesting "throwing away" a person (which low-effort dating apps
//     do, triggering objectification).
//   - Labels fade in proportionally — progressive commitment, not binary.

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Chip } from '@/src/components/ui/Chip';
import { CompatibilityBadge } from '@/src/components/ui/CompatibilityBadge';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import type { DiscoverProfile } from '@/src/types';
import { locationLabel } from '@/src/utils/format';
import { haptics } from '@/src/utils/haptics';

const SWIPE_THRESHOLD = 110;
const ROTATION_MAX = 8;

interface Props {
  profile: DiscoverProfile;
  onSwipe: (action: 'like' | 'pass') => void;
  onOpenDetails?: () => void;
  /** If false, the card is inert (used for stacked cards below the top). */
  active?: boolean;
  /** Card index in the stack (0 = top). */
  index?: number;
}

function SwipeCardBase({
  profile,
  onSwipe,
  onOpenDetails,
  active = true,
  index = 0,
}: Props) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const commitSwipe = useCallback(
    (action: 'like' | 'pass') => {
      haptics.medium();
      onSwipe(action);
    },
    [onSwipe]
  );

  const pan = Gesture.Pan()
    .enabled(active)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      // Y follows with dampening so the card doesn't fly off-screen vertically.
      translateY.value = startY.value + e.translationY * 0.4;
    })
    .onEnd((e) => {
      const tx = translateX.value;
      const flung = Math.abs(e.velocityX) > 800;
      if (tx > SWIPE_THRESHOLD || (flung && e.velocityX > 0)) {
        translateX.value = withTiming(width * 1.3, { duration: 260 });
        translateY.value = withTiming(translateY.value, { duration: 260 });
        runOnJS(commitSwipe)('like');
      } else if (tx < -SWIPE_THRESHOLD || (flung && e.velocityX < 0)) {
        translateX.value = withTiming(-width * 1.3, { duration: 260 });
        translateY.value = withTiming(translateY.value, { duration: 260 });
        runOnJS(commitSwipe)('pass');
      } else {
        translateX.value = withSpring(0, { mass: 0.6, damping: 18, stiffness: 200 });
        translateY.value = withSpring(0, { mass: 0.6, damping: 18, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rot = interpolate(
      translateX.value,
      [-width, 0, width],
      [-ROTATION_MAX, 0, ROTATION_MAX],
      Extrapolation.CLAMP
    );
    // Stacked cards below the top card sit slightly scaled/behind.
    const stackScale = 1 - index * 0.04;
    const stackTranslateY = index * 10;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + stackTranslateY },
        { rotate: `${rot}deg` },
        { scale: stackScale },
      ],
    };
  });

  const likeLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        rotate: '-12deg',
      },
    ],
  }));
  const passLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
    transform: [{ rotate: '12deg' }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        pointerEvents={active ? 'auto' : 'none'}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radii.card,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
              },
              android: { elevation: 8 },
            }),
          },
          cardStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.card,
            { borderRadius: theme.radii.card, overflow: 'hidden' },
          ]}
        >
          <Image
            source={{ uri: profile.mainPhoto }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={180}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: 'L9AB*A?b00xu~qof-;fQ00WB_3M{' }}
          />

          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.88)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* LIKE / PASS overlays */}
          <Animated.View
            style={[styles.stamp, styles.likeStamp, likeLabelStyle]}
            pointerEvents="none"
          >
            <Text variant="title2" color="#FFFFFF">LIKE</Text>
          </Animated.View>
          <Animated.View
            style={[styles.stamp, styles.passStamp, passLabelStyle]}
            pointerEvents="none"
          >
            <Text variant="title2" color="#FFFFFF">PASS</Text>
          </Animated.View>

          {/* Top row: compatibility + photo count */}
          <View style={styles.topRow} pointerEvents="box-none">
            <CompatibilityBadge score={profile.compatibilityScore} />
            <View
              style={[
                styles.photoCount,
                { backgroundColor: 'rgba(0,0,0,0.4)' },
              ]}
            >
              <Ionicons name="images-outline" size={14} color="#fff" />
              <Text variant="captionMedium" color="#fff" style={{ marginLeft: 4 }}>
                {profile.photoCount}
              </Text>
            </View>
          </View>

          {/* Bottom info */}
          <View style={styles.bottom}>
            <View style={styles.nameRow}>
              <Text variant="title1" color="#FFFFFF">
                {profile.fullName.split(' ')[0]}
              </Text>
              <Text variant="title1" color="rgba(255,255,255,0.85)" style={{ marginLeft: 8 }}>
                {profile.age}
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              color="rgba(255,255,255,0.9)"
              style={{ marginBottom: 10 }}
              numberOfLines={1}
            >
              {locationLabel(profile.city, profile.country)}
            </Text>
            {profile.bio ? (
              <Text
                variant="body"
                color="rgba(255,255,255,0.9)"
                numberOfLines={2}
                style={{ marginBottom: 12 }}
              >
                {profile.bio}
              </Text>
            ) : null}

            <View style={styles.chipsRow}>
              {profile.interests.slice(0, 3).map((i) => (
                <Chip key={i} label={i} size="sm" variant="outline" />
              ))}
            </View>
          </View>

          {/* Tap target for details */}
          {onOpenDetails && active ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {/* Intentionally not covering gestures — info icon at corner */}
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
  },
  topRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  photoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  bottom: {
    position: 'absolute',
    bottom: 22,
    left: 22,
    right: 22,
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stamp: {
    position: 'absolute',
    top: 80,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 3,
    borderRadius: 10,
  },
  likeStamp: {
    left: 24,
    borderColor: '#5AA572',
    backgroundColor: 'rgba(90,165,114,0.15)',
  },
  passStamp: {
    right: 24,
    borderColor: '#E0836A',
    backgroundColor: 'rgba(224,131,106,0.15)',
  },
});

export const SwipeCard = memo(SwipeCardBase);
