// app/settings/report.tsx — Report a user.
//
// Accepts a `userId` query param (passed by profile/[userId].tsx or chat/[id].tsx).
// Lets the reporter pick one reason from REPORT_REASONS and optionally elaborate.
// Submits via useReportUser; navigates back on success with a toast.
//
// Design notes:
//  - Single-select reason list with animated check indicator (no extra tap needed)
//  - Details textarea only reveals after a reason is selected (progressive disclosure)
//  - Destructive submit button stays disabled until a reason is chosen
//  - Haptic confirmation on success — tactile closure before navigation

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SoulLinkLoader } from '@/src/components/ui/SoulLinkLoader';
import { Text } from '@/src/components/ui/Text';
import { useToast } from '@/src/components/ui/Toast';
import { REPORT_REASONS } from '@/src/constants/data';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useReportUser } from '@/src/hooks/useApi';
import { haptics } from '@/src/utils/haptics';

const MAX_DETAILS = 400;

// ─── Reason row ────────────────────────────────────────────────────────────────

interface ReasonRowProps {
    label: string;
    selected: boolean;
    onPress: () => void;
}

function ReasonRow({ label, selected, onPress }: ReasonRowProps) {
    const { theme } = useTheme();
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }, () => {
            scale.value = withSpring(1, { damping: 18, stiffness: 260 });
        });
        haptics.selection();
        onPress();
    };

    return (
        <Animated.View style={animStyle}>
            <Pressable
                onPress={handlePress}
                style={[
                    styles.reasonRow,
                    {
                        backgroundColor: selected
                            ? theme.colors.surfaceMuted
                            : theme.colors.surface,
                        borderColor: selected
                            ? theme.colors.coral
                            : theme.colors.borderSubtle,
                        borderWidth: selected ? 1 : 0.5,
                    },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
            >
                <Text
                    variant="body"
                    style={{
                        flex: 1,
                        color: selected ? theme.colors.text : theme.colors.textSecondary,
                    }}
                >
                    {label}
                </Text>
                <View
                    style={[
                        styles.radioOuter,
                        {
                            borderColor: selected ? theme.colors.coral : theme.colors.border,
                            backgroundColor: selected
                                ? theme.colors.coral
                                : 'transparent',
                        },
                    ]}
                >
                    {selected && (
                        <Animated.View entering={FadeIn.duration(140)}>
                            <Ionicons name="checkmark" size={12} color={theme.colors.textOnPrimary} />
                        </Animated.View>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ReportUser() {
    const { theme } = useTheme();
    const router = useRouter();
    const toast = useToast();
    const { userId } = useLocalSearchParams<{ userId: string }>();

    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');
    const inputRef = useRef<TextInput>(null);

    const { mutateAsync: reportUser, isPending } = useReportUser();

    const handleSubmit = useCallback(async () => {
        if (!selectedReason || !userId || isPending) return;

        Keyboard.dismiss();

        try {
            await reportUser({
                userId,
                reason: selectedReason,
                details: details.trim() || undefined,
            });

            haptics.success();
            toast.show({
                message: 'Report submitted. Our team reviews within 24 hours.',
                tone: 'success',
            });

            // Go back two levels if we came from a profile inside chat,
            // otherwise just pop once.
            if (router.canGoBack()) {
                router.back();
            }
        } catch (e) {
            haptics.error();
            toast.show({
                message: (e as Error).message ?? 'Failed to submit report. Please try again.',
                tone: 'error',
            });
        }
    }, [selectedReason, userId, details, isPending, reportUser, toast, router]);

    const charsLeft = MAX_DETAILS - details.length;

    return (
        <SafeScreen padded={false}>
            <ScreenHeader title="Report profile" />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scroll,
                        { paddingBottom: 40 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header copy ─────────────────────────────────────── */}
                    <Animated.View entering={FadeInDown.duration(260).springify()}>
                        <View
                            style={[
                                styles.warningBanner,
                                {
                                    backgroundColor: theme.colors.surfaceMuted,
                                    borderColor: theme.colors.borderSubtle,
                                },
                            ]}
                        >
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={20}
                                color={theme.colors.textSecondary}
                            />
                            <Text
                                variant="footnote"
                                tone="secondary"
                                style={{ flex: 1 }}
                            >
                                Reports are anonymous and reviewed by our trust & safety
                                team within 24 hours. False reports may affect your account.
                            </Text>
                        </View>
                    </Animated.View>

                    {/* ── Reason label ────────────────────────────────────── */}
                    <Text
                        variant="bodyMedium"
                        style={[styles.sectionLabel, { color: theme.colors.text }]}
                    >
                        What's the issue?
                    </Text>

                    {/* ── Reason list ─────────────────────────────────────── */}
                    <View style={styles.reasonList}>
                        {REPORT_REASONS.map((r, idx) => (
                            <Animated.View
                                key={r.value}
                                entering={FadeInDown.delay(idx * 40)
                                    .duration(260)
                                    .springify()}
                            >
                                <ReasonRow
                                    label={r.label}
                                    selected={selectedReason === r.value}
                                    onPress={() => setSelectedReason(r.value)}
                                />
                            </Animated.View>
                        ))}
                    </View>

                    {/* ── Optional details (appears after a reason is picked) */}
                    {selectedReason && (
                        <Animated.View
                            entering={FadeInDown.duration(300).springify()}
                            style={styles.detailsSection}
                        >
                            <View style={styles.detailsLabelRow}>
                                <Text
                                    variant="bodyMedium"
                                    style={{ color: theme.colors.text }}
                                >
                                    Additional details
                                </Text>
                                <Text variant="caption" tone="secondary">
                                    Optional · {charsLeft} left
                                </Text>
                            </View>

                            <TextInput
                                ref={inputRef}
                                value={details}
                                onChangeText={(t) =>
                                    setDetails(t.slice(0, MAX_DETAILS))
                                }
                                placeholder="Describe what happened…"
                                placeholderTextColor={theme.colors.textTertiary}
                                multiline
                                textAlignVertical="top"
                                maxLength={MAX_DETAILS}
                                style={[
                                    styles.textarea,
                                    {
                                        color: theme.colors.text,
                                        backgroundColor: theme.colors.surface,
                                        borderColor: theme.colors.borderSubtle,
                                    },
                                ]}
                                accessibilityLabel="Additional details about your report"
                            />
                        </Animated.View>
                    )}

                    {/* ── Submit ──────────────────────────────────────────── */}
                    <Animated.View
                        entering={FadeInDown.delay(REPORT_REASONS.length * 40 + 60)
                            .duration(300)
                            .springify()}
                        style={styles.submitArea}
                    >
                        <Pressable
                            onPress={handleSubmit}
                            disabled={!selectedReason || isPending}
                            style={[
                                styles.submitButton,
                                {
                                    backgroundColor:
                                        selectedReason && !isPending
                                            ? theme.colors.error
                                            : theme.colors.surfaceMuted,
                                },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Submit report"
                            accessibilityState={{ disabled: !selectedReason || isPending }}
                        >
                            {isPending ? (
                                <SoulLinkLoader />
                            ) : (
                                <>
                                    <Ionicons
                                        name="flag-outline"
                                        size={18}
                                        color={
                                            selectedReason
                                                ? theme.colors.textOnPrimary
                                                : theme.colors.textTertiary
                                        }
                                    />
                                    <Text
                                        variant="bodyMedium"
                                        style={{
                                            color: selectedReason
                                                ? theme.colors.textOnPrimary
                                                : theme.colors.textTertiary,
                                            marginLeft: 8,
                                        }}
                                    >
                                        Submit report
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        <Text
                            variant="footnote"
                            tone="secondary"
                            style={{ textAlign: 'center', marginTop: 12 }}
                        >
                            Submitting will not automatically block this person.{'\n'}
                            You can block them separately in their profile.
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 8,
        gap: 0,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        borderWidth: 0.5,
        marginBottom: 24,
    },
    sectionLabel: {
        marginBottom: 12,
    },
    reasonList: {
        gap: 10,
    },
    reasonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderRadius: 14,
        gap: 14,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsSection: {
        marginTop: 28,
        gap: 10,
    },
    detailsLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textarea: {
        borderWidth: 0.5,
        borderRadius: 14,
        padding: 14,
        fontSize: 15,
        lineHeight: 22,
        minHeight: 110,
        maxHeight: 200,
    },
    submitArea: {
        marginTop: 32,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 14,
        gap: 2,
    },
});