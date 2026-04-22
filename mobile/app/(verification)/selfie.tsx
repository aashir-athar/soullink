// app/(verification)/selfie.tsx — Upload a verification selfie.
//
// The user takes a selfie in a pose similar to one of their profile photos.
// We upload via the photo-upload endpoint (it's a generic Cloudinary proxy)
// and submit the URL through POST /profile/verify.
//
// Three states in one screen:
//   1. User hasn't uploaded yet — show instructions + Take selfie CTA
//   2. User submitted, pending human review — calm "we're reviewing" card
//   3. User was rejected — clear explanation + retake option

import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  useMyProfile,
  useSubmitVerification,
  useUploadPhoto,
} from '@/src/hooks/useApi';
import { haptics } from '@/src/utils/haptics';

export default function VerificationSelfie() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();

  const { data: profile, refetch } = useMyProfile();
  const { mutateAsync: upload, isPending: uploading } = useUploadPhoto();
  const { mutateAsync: submit, isPending: submitting } = useSubmitVerification();

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = profile?.verificationStatus ?? 'not_submitted';

  const takeSelfie = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Camera permission is required to verify.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.85,
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    setLocalUri(result.assets[0].uri);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!localUri) return;
    try {
      const uploaded = await upload(localUri);
      await submit(uploaded.cloudinaryUrl);
      haptics.success();
      await refetch();
      setLocalUri(null);
    } catch (e) {
      setError((e as Error).message);
      haptics.error();
    }
  };

  const handleContinue = async () => {
    await refetch();
    router.replace('/');
  };

  if (status === 'approved') {
    // Edge case — route away immediately
    return (
      <SafeScreen>
        <Button
          label="Continue"
          onPress={() => router.replace('/(tabs)')}
          fullWidth
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScreenHeader title="" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title1" style={{ marginBottom: 10 }}>
          One last step
        </Text>
        <Text variant="bodyLarge" tone="secondary" style={{ marginBottom: 28 }}>
          We verify every profile manually to keep Soullink a safe space.
          Usually done within 24 hours.
        </Text>

        {status === 'pending' ? (
          <StatusCard
            icon="time-outline"
            title="Under review"
            body="Thanks for submitting. A human reviewer will approve your profile shortly. You'll get a notification — feel free to close the app."
            accent={theme.colors.warning}
          />
        ) : null}

        {status === 'rejected' ? (
          <StatusCard
            icon="alert-circle-outline"
            title="Verification wasn't approved"
            body="Your selfie didn't match your profile photos clearly, or your photos violated our content rules. Please retake and try again."
            accent={theme.colors.error}
          />
        ) : null}

        <View
          style={[
            styles.exampleCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderSubtle,
              borderRadius: theme.radii.xl,
            },
          ]}
        >
          <Text variant="title3" style={{ marginBottom: 14 }}>
            How to take your selfie
          </Text>
          <Row
            icon="person-outline"
            text="Face the camera. Good lighting."
          />
          <Row
            icon="camera-reverse-outline"
            text="Match the angle of one of your profile photos."
          />
          <Row
            icon="eye-off-outline"
            text="No sunglasses, no filters, no edits."
          />
          <Row
            icon="shield-checkmark-outline"
            text="Your selfie is never shown to other users."
          />
        </View>

        {localUri ? (
          <View style={[styles.previewWrap, { borderRadius: theme.radii.xl }]}>
            <Image
              source={{ uri: localUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory"
            />
          </View>
        ) : null}

        {error ? (
          <Text
            variant="caption"
            tone="error"
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radii.md,
            }}
          >
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={{ paddingTop: 12, gap: 10 }}>
        {status === 'pending' ? (
          <>
            <Button
              label="Refresh status"
              onPress={handleContinue}
              fullWidth
              variant="secondary"
            />
            <Button
              label="Sign out"
              onPress={() => signOut({ redirectUrl: '/welcome' })}
              fullWidth
              variant="ghost"
            />
          </>
        ) : localUri ? (
          <>
            <Button
              label="Submit for review"
              onPress={handleSubmit}
              loading={uploading || submitting}
              fullWidth
            />
            <Button
              label="Retake"
              onPress={takeSelfie}
              variant="ghost"
              fullWidth
            />
          </>
        ) : (
          <Button
            label="Take selfie"
            onPress={takeSelfie}
            fullWidth
            leftIcon={
              <Ionicons name="camera-outline" size={18} color={theme.colors.background} />
            }
          />
        )}
      </View>
    </SafeScreen>
  );
}

function Row({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      <Text variant="body" tone="secondary" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function StatusCard({
  icon,
  title,
  body,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  accent: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.statusCard,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.xl,
          borderLeftColor: accent,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={accent} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="title3">{title}</Text>
        <Text variant="body" tone="secondary">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exampleCard: {
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  previewWrap: {
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  statusCard: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
  },
});