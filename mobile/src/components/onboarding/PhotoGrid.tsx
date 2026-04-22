// src/components/onboarding/PhotoGrid.tsx
//
// Works in TWO modes:
//   Onboarding  — photos are LocalPhoto[] (localUri, no cloudinaryUrl yet)
//   Edit profile — photos are Photo[] (cloudinaryUrl already uploaded)
//
// The component detects which kind it has and renders the right URI.
// onChange always emits in the same shape it received.

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import type { LocalPhoto, Photo } from '@/src/types';
import { haptics } from '@/src/utils/haptics';

// A unified display type — can be either LocalPhoto or Photo
type AnyPhoto = LocalPhoto | Photo;

function getUri(photo: AnyPhoto): string {
  if ('cloudinaryUrl' in photo) return photo.cloudinaryUrl;
  return photo.localUri;
}

interface Props {
  photos: AnyPhoto[];
  onChange: (photos: AnyPhoto[]) => void;
  maxPhotos?: number;
}

function PhotoGridBase({ photos, onChange, maxPhotos = 5 }: Props) {
  const { theme } = useTheme();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const pickImage = useCallback(async () => {
    setPermissionError(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPermissionError('Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;

    // New locally-picked photos are always LocalPhoto shape
    const newPhoto: LocalPhoto = {
      localUri,
      isMain: photos.length === 0,
      order: photos.length,
    };

    onChange([...photos, newPhoto]);
    haptics.success();
  }, [photos, onChange]);

  const setAsMain = useCallback(
    (index: number) => {
      const next = photos.map((p, i) => ({ ...p, isMain: i === index }));
      onChange(next);
      setSelectedIdx(null);
    },
    [photos, onChange]
  );

  const remove = useCallback(
    (index: number) => {
      const next = photos
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, order: i }));
      if (!next.some((p) => p.isMain) && next.length > 0) next[0]!.isMain = true;
      onChange(next);
      setSelectedIdx(null);
      haptics.light();
    },
    [photos, onChange]
  );

  const slots = Array.from({ length: maxPhotos }, (_, i) => photos[i] ?? null);

  return (
    <>
      <View style={styles.grid}>
        {slots.map((photo, idx) => {
          if (!photo) {
            const isNextSlot = idx === photos.length;
            return (
              <Pressable
                key={`slot-${idx}`}
                onPress={isNextSlot ? pickImage : undefined}
                disabled={!isNextSlot}
                style={[
                  styles.cell,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderRadius: theme.radii.lg,
                    borderColor: isNextSlot
                      ? theme.colors.borderStrong
                      : theme.colors.borderSubtle,
                    borderWidth: isNextSlot ? 1.5 : StyleSheet.hairlineWidth,
                    borderStyle: isNextSlot ? 'dashed' : 'solid',
                    opacity: isNextSlot ? 1 : 0.5,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={isNextSlot ? 'Add photo' : 'Empty photo slot'}
              >
                <Ionicons
                  name="add"
                  size={28}
                  color={isNextSlot ? theme.colors.text : theme.colors.textTertiary}
                />
              </Pressable>
            );
          }

          const uri = getUri(photo);

          return (
            <Pressable
              key={`photo-${idx}`}
              onPress={() => {
                haptics.light();
                setSelectedIdx(idx);
              }}
              style={[
                styles.cell,
                { borderRadius: theme.radii.lg, overflow: 'hidden' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Photo ${idx + 1}${photo.isMain ? ', main photo' : ''}`}
            >
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={150}
                cachePolicy="memory-disk"
              />
              {photo.isMain ? (
                <View style={[styles.mainBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text variant="micro" color={theme.colors.textOnPrimary}>
                    MAIN
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {permissionError ? (
        <Text variant="caption" tone="error" style={{ marginTop: 8, paddingHorizontal: 4 }}>
          {permissionError}
        </Text>
      ) : null}

      <BottomSheet visible={selectedIdx !== null} onClose={() => setSelectedIdx(null)}>
        <View style={{ padding: 20, gap: 12 }}>
          <Text variant="title3" style={{ marginBottom: 8 }}>
            Photo options
          </Text>
          {selectedIdx !== null && photos[selectedIdx] && !photos[selectedIdx]!.isMain ? (
            <Button
              label="Set as main photo"
              variant="secondary"
              fullWidth
              onPress={() => setAsMain(selectedIdx)}
            />
          ) : null}
          <Button
            label="Remove photo"
            variant="destructive"
            fullWidth
            onPress={() => selectedIdx !== null && remove(selectedIdx)}
          />
          <Button
            label="Cancel"
            variant="ghost"
            fullWidth
            onPress={() => setSelectedIdx(null)}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '31.5%',
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});

export const PhotoGrid = memo(PhotoGridBase);
// Re-export the unified type so edit.tsx can use it
export type { AnyPhoto };
