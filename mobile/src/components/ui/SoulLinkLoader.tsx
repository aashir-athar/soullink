// src/components/ui/SoulLinkLoader.tsx — Branded loading screen for Soullink.
//
// Replaces ActivityIndicator everywhere in the app.
// Uses Reanimated 4 (already in deps) for a pulsing coral heart that breathes.
// Fully theme-aware — works in both light and dark mode.

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';

interface Props {
    /** Optional label shown below the icon. Defaults to nothing. */
    label?: string;
    /** Fill the whole screen (default) or just inline size. */
    fullscreen?: boolean;
}

export function SoulLinkLoader({ label, fullscreen = true }: Props) {
    const { theme } = useTheme();

    // Heartbeat: scale up slightly, back down, tiny pause — like a real pulse
    const scale = useSharedValue(1);
    // Soft glow ring that pulses outward and fades
    const ringScale = useSharedValue(1);
    const ringOpacity = useSharedValue(0.6);
    // Dots below the heart
    const dot1 = useSharedValue(0.3);
    const dot2 = useSharedValue(0.3);
    const dot3 = useSharedValue(0.3);

    useEffect(() => {
        // Heartbeat pulse — two quick beats then pause
        scale.value = withRepeat(
            withSequence(
                withTiming(1.18, { duration: 160, easing: Easing.out(Easing.quad) }),
                withTiming(0.95, { duration: 120, easing: Easing.in(Easing.quad) }),
                withTiming(1.12, { duration: 120, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: 400 }), // pause between beats
            ),
            -1,
            false
        );

        // Glow ring expands and fades in sync with the heartbeat
        ringScale.value = withRepeat(
            withSequence(
                withTiming(1.8, { duration: 400, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: 700 }),
                withTiming(1, { duration: 400 }), // pause
            ),
            -1,
            false
        );
        ringOpacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
                withTiming(0.5, { duration: 100 }),
                withTiming(0.5, { duration: 600 }),
            ),
            -1,
            false
        );

        // Three dots — wave pattern with 200ms stagger
        const dotDuration = 500;
        const dotEasing = Easing.inOut(Easing.sin);
        const dotAnim = (delay: number) =>
            withDelay(
                delay,
                withRepeat(
                    withSequence(
                        withTiming(1, { duration: dotDuration, easing: dotEasing }),
                        withTiming(0.3, { duration: dotDuration, easing: dotEasing }),
                    ),
                    -1,
                    false
                )
            );

        dot1.value = dotAnim(0);
        dot2.value = dotAnim(180);
        dot3.value = dotAnim(360);
    }, []);

    const heartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value,
    }));

    const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
    const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
    const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

    const content = (
        <View style={styles.inner}>
            {/* Glow ring behind the heart */}
            <View style={styles.heartWrap}>
                <Animated.View
                    style={[
                        styles.ring,
                        { borderColor: theme.colors.primary },
                        ringStyle,
                    ]}
                />
                {/* Heart emoji rendered via Text for crisp rendering on all platforms */}
                <Animated.View style={heartStyle}>
                    <Text style={[styles.heart, { color: theme.colors.primary }]}>
                        ♥
                    </Text>
                </Animated.View>
            </View>

            {/* Wave dots */}
            <View style={styles.dotsRow}>
                <Animated.View
                    style={[styles.dot, { backgroundColor: theme.colors.primary }, dot1Style]}
                />
                <Animated.View
                    style={[styles.dot, { backgroundColor: theme.colors.primary }, dot2Style]}
                />
                <Animated.View
                    style={[styles.dot, { backgroundColor: theme.colors.primary }, dot3Style]}
                />
            </View>

            {label ? (
                <Text
                    variant="caption"
                    tone="tertiary"
                    style={{ marginTop: 16, letterSpacing: 0.4 }}
                >
                    {label}
                </Text>
            ) : null}
        </View>
    );

    if (!fullscreen) return content;

    return (
        <View
            style={[styles.fullscreen, { backgroundColor: theme.colors.background }]}
        >
            {content}
        </View>
    );
}

const styles = StyleSheet.create({
    fullscreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    heartWrap: {
        width: 72,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 1.5,
    },
    heart: {
        fontSize: 38,
        lineHeight: 44,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 7,
        marginTop: 24,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});