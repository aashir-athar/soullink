// app/(tabs)/index.tsx — Discover screen with swipe deck.
//
// Architecture:
//   - Infinite query feeds cards in pages of 20.
//   - Local deck index advances synchronously on swipe; we never re-render
//     the whole list, we just show cards [i, i+1] stacked.
//   - Swipe commit fires the /swipe mutation in the background. On match,
//     we push the celebration overlay.
//   - Daily limits enforced client-side for UX (disable actions) AND
//     server-side (authoritative).

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { DiscoverActions } from '@/src/components/cards/DiscoverActions';
import { SwipeCard } from '@/src/components/cards/SwipeCard';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { IconButton } from '@/src/components/ui/IconButton';
import { Input } from '@/src/components/ui/Input';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { SegmentedControl, type SegmentOption } from '@/src/components/ui/SegmentedControl';
import { Text } from '@/src/components/ui/Text';

import { SoulLinkLoader } from '@/src/components/ui/SoulLinkLoader';
import { useToast } from '@/src/components/ui/Toast';
import { COMPLIMENT_SUGGESTIONS } from '@/src/constants/data';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  useDailyLimits,
  useDiscoverFeed,
  useMyProfile,
  useSwipe,
} from '@/src/hooks/useApi';
import { useAppStore } from '@/src/store/useAppStore';
import type { DiscoverProfile, MatchingMode } from '@/src/types';
import { countdownTo } from '@/src/utils/format';
import { haptics } from '@/src/utils/haptics';
import { modeColor, modeLabel } from '@/src/utils/modes';

export default function Discover() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { height } = useWindowDimensions();

  const { data: profile } = useMyProfile();
  const { activeMode, setActiveMode, filters, setFilters } = useAppStore();
  const { data: limits } = useDailyLimits();

  // Restrict modes to what the user selected during onboarding.
  const availableModes: MatchingMode[] = useMemo(
    () => (profile?.lookingFor?.length ? profile.lookingFor : ['friendship']),
    [profile?.lookingFor]
  );
  // Safeguard: if activeMode isn't in availableModes, pick the first available.
  const safeMode: MatchingMode = availableModes.includes(activeMode)
    ? activeMode
    : availableModes[0]!;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useDiscoverFeed(safeMode, filters);

  const allProfiles: DiscoverProfile[] = useMemo(() => {
    return data?.pages.flatMap((p) => p.profiles) ?? [];
  }, [data]);

  const [index, setIndex] = useState(0);
  const [complimentSheet, setComplimentSheet] = useState<DiscoverProfile | null>(null);
  const [filterSheet, setFilterSheet] = useState(false);

  // When the user changes mode or filters, reset the deck position.
  React.useEffect(() => {
    setIndex(0);
  }, [safeMode, filters.ageMin, filters.ageMax, filters.sameCity]);

  const { mutateAsync: doSwipe, isPending: swiping } = useSwipe();

  const topProfile = allProfiles[index];
  const nextProfile = allProfiles[index + 1];

  // Pre-fetch next page when we're near the end of the current one.
  React.useEffect(() => {
    if (
      allProfiles.length > 0 &&
      index >= allProfiles.length - 4 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [index, allProfiles.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const outOfLikes = (limits?.likesUsed ?? 0) >= (limits?.likesLimit ?? 100);
  const canCompliment =
    (limits?.complimentsUsed ?? 0) < (limits?.complimentsLimit ?? 5);

  const handleSwipe = useCallback(
    async (action: 'like' | 'pass', profileForSwipe: DiscoverProfile, compliment?: string) => {
      // Optimistically advance the deck.
      setIndex((i) => i + 1);

      if (action === 'like' && outOfLikes) {
        haptics.warning();
        toast.show({
          message: `You've used all your likes today. Resets in ${limits ? countdownTo(limits.resetTime) : 'a few hours'
            }.`,
          tone: 'default',
        });
        return;
      }

      try {
        const res = await doSwipe({
          targetUserId: profileForSwipe.userId,
          action,
          mode: safeMode,
          compliment,
        });
        if (res.isMatch && res.matchId) {
          haptics.success();
          router.push({
            pathname: '/match-celebration',
            params: {
              matchId: res.matchId,
              name: profileForSwipe.fullName,
              photo: profileForSwipe.mainPhoto,
            },
          });
        }
      } catch (e) {
        toast.show({ message: (e as Error).message, tone: 'error' });
      }
    },
    [doSwipe, safeMode, outOfLikes, limits, toast, router]
  );

  const openCompliment = (p: DiscoverProfile) => {
    if (!canCompliment) {
      toast.show({
        message: `You've used your 5 compliments for today. Resets in ${limits ? countdownTo(limits.resetTime) : 'a few hours'
          }.`,
        tone: 'default',
      });
      return;
    }
    setComplimentSheet(p);
  };

  const segOptions: SegmentOption<MatchingMode>[] = useMemo(
    () =>
      availableModes.map((m) => ({
        value: m,
        label: modeLabel(m),
        accent: modeColor(m, theme.colors).base,
      })),
    [availableModes, theme.colors]
  );

  return (
    <SafeScreen edgeToEdgeBottom padded={false}>
      <View style={styles.headerRow}>
        <Text variant="title2" style={{ flex: 1 }}>
          Discover
        </Text>
        <IconButton
          icon={<Ionicons name="options-outline" size={20} color={theme.colors.text} />}
          onPress={() => setFilterSheet(true)}
          variant="ghost"
          accessibilityLabel="Filters"
        />
      </View>

      <View style={styles.segWrap}>
        <SegmentedControl
          options={segOptions}
          value={safeMode}
          onChange={setActiveMode}
        />
      </View>

      {limits ? (
        <View style={styles.limitsRow}>
          <LimitPill
            label="Likes"
            used={limits.likesUsed}
            max={limits.likesLimit}
          />
          <LimitPill
            label="Compliments"
            used={limits.complimentsUsed}
            max={limits.complimentsLimit}
          />
        </View>
      ) : null}

      <View style={[styles.deckWrap, { height: height * 0.58 }]}>
        {isLoading ? (
          <View style={styles.loading}>
            <SoulLinkLoader fullscreen={false} />
          </View>
        ) : !topProfile ? (
          <EmptyState
            icon={
              <Ionicons
                name="sparkles-outline"
                size={38}
                color={theme.colors.textSecondary}
              />
            }
            title="That's everyone for now"
            description="Check back soon, or widen your filters to see more."
            action={
              <Button
                label="Adjust filters"
                variant="secondary"
                onPress={() => setFilterSheet(true)}
              />
            }
          />
        ) : (
          <>
            {nextProfile ? (
              <View style={styles.stackCard}>
                <SwipeCard
                  profile={nextProfile}
                  onSwipe={() => { }}
                  active={false}
                  index={1}
                />
              </View>
            ) : null}
            <View style={styles.stackCard}>
              <SwipeCard
                key={topProfile.userId}
                profile={topProfile}
                onSwipe={(a) => handleSwipe(a, topProfile)}
                active={!swiping}
              />
            </View>
          </>
        )}
      </View>

      {topProfile ? (
        <View style={styles.actionsRow}>
          <DiscoverActions
            onPass={() => handleSwipe('pass', topProfile)}
            onLike={() => handleSwipe('like', topProfile)}
            onCompliment={() => openCompliment(topProfile)}
            disabled={swiping}
            canCompliment={canCompliment}
          />
        </View>
      ) : null}

      <FilterSheet
        visible={filterSheet}
        filters={filters}
        onChange={setFilters}
        onClose={() => {
          setFilterSheet(false);
          refetch();
        }}
      />

      <ComplimentSheet
        target={complimentSheet}
        onClose={() => setComplimentSheet(null)}
        onSend={(text) => {
          if (!complimentSheet) return;
          const target = complimentSheet;
          setComplimentSheet(null);
          handleSwipe('like', target, text);
          toast.show({ message: 'Compliment sent.', tone: 'success' });
        }}
      />
    </SafeScreen>
  );
}

function LimitPill({ label, used, max }: { label: string; used: number; max: number }) {
  const { theme } = useTheme();
  const low = used >= max;
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: low ? theme.colors.primarySoft : theme.colors.surfaceMuted,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <Text variant="micro" tone="tertiary" style={{ letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Text>
      <Text variant="captionMedium" tone={low ? 'error' : 'primary'}>
        {used} / {max}
      </Text>
    </View>
  );
}

function FilterSheet({
  visible,
  filters,
  onChange,
  onClose,
}: {
  visible: boolean;
  filters: { ageMin: number; ageMax: number; sameCity: boolean };
  onChange: (patch: Partial<typeof filters>) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} height={460}>
      <View style={{ padding: 20, gap: 20 }}>
        <Text variant="title3">Filters</Text>

        <View>
          <Text variant="captionMedium" tone="secondary" style={{ marginBottom: 8 }}>
            Age range
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Input
              containerStyle={{ flex: 1 }}
              label=""
              value={String(filters.ageMin)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                if (Number.isFinite(n)) onChange({ ageMin: Math.max(18, n) });
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Input
              containerStyle={{ flex: 1 }}
              label=""
              value={String(filters.ageMax)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                if (Number.isFinite(n)) onChange({ ageMax: Math.min(99, n) });
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        <View>
          <Text variant="captionMedium" tone="secondary" style={{ marginBottom: 8 }}>
            Location
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Chip
              label="All cities"
              selected={!filters.sameCity}
              onPress={() => onChange({ sameCity: false })}
              variant="outline"
            />
            <Chip
              label="Same city only"
              selected={filters.sameCity}
              onPress={() => onChange({ sameCity: true })}
              variant="outline"
            />
          </View>
        </View>

        <Button
          label="Apply"
          onPress={onClose}
          fullWidth
          style={{ marginTop: 10 }}
        />
      </View>
    </BottomSheet>
  );
}

function ComplimentSheet({
  target,
  onClose,
  onSend,
}: {
  target: DiscoverProfile | null;
  onClose: () => void;
  onSend: (text: string) => void;
}) {
  const { theme } = useTheme();
  const [text, setText] = useState('');

  React.useEffect(() => {
    if (target) setText('');
  }, [target]);

  return (
    <BottomSheet visible={!!target} onClose={onClose} height={520}>
      <View style={{ padding: 20, gap: 16 }}>
        <Text variant="title3">
          Compliment {target?.fullName.split(' ')[0] ?? ''}
        </Text>
        <Text variant="body" tone="secondary">
          Say something specific. Generic compliments are forgotten instantly.
        </Text>

        <Input
          value={text}
          onChangeText={setText}
          placeholder="Write your own, or tap a suggestion"
          multiline
          maxLength={200}
        />

        <View style={{ gap: 8 }}>
          {COMPLIMENT_SUGGESTIONS.slice(0, 3).map((s) => (
            <Pressable
              key={s}
              onPress={() => setText(s)}
              style={{
                padding: 12,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.surfaceMuted,
              }}
            >
              <Text variant="body" tone="secondary">
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          label="Send compliment"
          onPress={() => text.trim() && onSend(text.trim())}
          disabled={text.trim().length === 0}
          fullWidth
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  segWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  limitsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deckWrap: {
    flex: 1,
    marginHorizontal: 20,
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionsRow: {
    paddingVertical: 16,
    paddingBottom: 90,
  },
});