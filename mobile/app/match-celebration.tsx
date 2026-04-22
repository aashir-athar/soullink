// app/match-celebration.tsx — Full-screen match reveal.
//
// Psychology:
//   - We celebrate specifically and briefly. No confetti explosion —
//     that reads as manipulative/casino. Two portraits meeting = narrative
//     of mutual choice.
//   - CTA prioritises "Send a message" over "Keep swiping" — we nudge
//     toward connection without forcing it.

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useMyProfile } from '@/src/hooks/useApi';
import { haptics } from '@/src/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MatchCelebration() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMyProfile();

  const params = useLocalSearchParams<{
    matchId: string;
    name: string;
    photo: string;
  }>();

  const leftOffset = useSharedValue(-120);
  const rightOffset = useSharedValue(120);
  const scaleIn = useSharedValue(0.85);

  useEffect(() => {
    haptics.success();
    leftOffset.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    rightOffset.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    scaleIn.value = withSequence(
      withDelay(
        500,
        withTiming(1.06, { duration: 240, easing: Easing.out(Easing.cubic) })
      ),
      withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) })
    );
  }, [leftOffset, rightOffset, scaleIn]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftOffset.value }, { rotate: '-4deg' }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightOffset.value }, { rotate: '4deg' }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleIn.value }],
  }));

  const myPhoto =
    me?.photos.find((p) => p.isMain)?.cloudinaryUrl ?? me?.photos[0]?.cloudinaryUrl;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background ?? '#0E0D0C' },
      ]}
    >
      <LinearGradient
        colors={['#0E0D0C', '#1A1817', '#2A2725']}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ paddingTop: insets.top + 40, paddingHorizontal: 24, flex: 1 }}>
        <Animated.View style={textStyle}>
          <Text
            variant="micro"
            color="rgba(255,255,255,0.7)"
            style={{ letterSpacing: 1.8, marginBottom: 12 }}
          >
            YOU MATCHED
          </Text>
          <Text variant="display" color="#FFFFFF" style={{ marginBottom: 40 }}>
            You and {params.name?.split(' ')[0]} both chose each other.
          </Text>
        </Animated.View>

        <View style={styles.photoRow}>
          <Animated.View style={[styles.photoCard, leftStyle]}>
            {myPhoto ? (
              <Image
                source={{ uri: myPhoto }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : null}
          </Animated.View>
          <Animated.View style={[styles.photoCard, rightStyle]}>
            {params.photo ? (
              <Image
                source={{ uri: params.photo }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : null}
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeIn.delay(700).duration(400)}
          style={{ marginTop: 36, alignItems: 'center' }}
        >
          <Text variant="body" color="rgba(255,255,255,0.8)" align="center">
            The best first message is specific, warm, and one sentence.
          </Text>
        </Animated.View>
      </View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom:
            Platform.OS === 'ios' ? insets.bottom + 16 : insets.bottom + 20,
          gap: 12,
        }}
      >
        <Button
          label="Send a message"
          onPress={() => {
            router.replace({
              pathname: '/chat/[id]',
              params: {
                id: params.matchId,
                name: params.name,
                photo: params.photo,
              },
            });
          }}
          fullWidth
        />
        <Button
          label="Keep exploring"
          variant="ghost"
          onPress={() => router.back()}
          fullWidth
          style={{
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: StyleSheet.hairlineWidth,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: -24,
  },
  photoCard: {
    width: 156,
    height: 208,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#22201D',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 10 },
    }),
  },
});
