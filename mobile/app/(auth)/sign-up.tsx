// app/(auth)/sign-up.tsx

import { useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/contexts/ThemeContext';
import { haptics } from '@/src/utils/haptics';
import { Ionicons } from '@expo/vector-icons';

export default function SignUp() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageOk, setAgeOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState(false);
  const [code, setCode] = useState('');

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: createError } = await signUp.password({
        emailAddress: email,
        password,
      });
      if (createError) {
        setError(createError.longMessage ?? createError.message ?? 'Could not create account.');
        haptics.error();
        return;
      }
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(sendError.longMessage ?? sendError.message ?? 'Could not send verification code.');
        haptics.error();
        return;
      }
      setPendingCode(true);
      haptics.success();
    } catch (e) {
      const err = e as { errors?: { message?: string }[]; message?: string };
      setError(err.errors?.[0]?.message ?? err.message ?? 'Could not create account.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        setError(verifyError.longMessage ?? verifyError.message ?? 'Could not verify code.');
        haptics.error();
        return;
      }

      if (signUp.status === 'complete') {
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          setError(finalizeError.longMessage ?? finalizeError.message ?? 'Could not complete sign up.');
          haptics.error();
          return;
        }
        haptics.success();
        // Navigate to index — it detects no profile and routes to onboarding
        router.replace('/');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (e) {
      const err = e as { errors?: { message?: string }[]; message?: string };
      setError(err.errors?.[0]?.message ?? err.message ?? 'Could not verify code.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || fetchStatus === 'fetching';
  const disabled = !email || !password || !ageOk || isLoading;

  return (
    <SafeScreen keyboardAvoiding>
      <ScreenHeader title={pendingCode ? 'Check your email' : 'Create account'} />

      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!pendingCode ? (
          <>
            <Text variant="title1" style={{ marginBottom: 8 }}>
              Welcome to Soullink
            </Text>
            <Text variant="body" tone="secondary" style={{ marginBottom: 28 }}>
              Your profile is private until you're verified.
            </Text>

            <View style={{ gap: 16 }}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                autoComplete="password-new"
                textContentType="newPassword"
                hint="Use a mix of letters, numbers, and symbols."
              />
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setAgeOk((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ageOk }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: theme.colors.borderStrong,
                      backgroundColor: ageOk ? theme.colors.text : 'transparent',
                    },
                  ]}
                >
                  {ageOk ? (
                    <Ionicons name="checkmark" size={14} color={theme.colors.background} />
                  ) : null}
                </View>
                <Text variant="body" tone="secondary" style={{ flex: 1 }}>
                  I'm 18 or older and agree to Soullink's community rules.
                </Text>
              </Pressable>
            </View>

            {error ? (
              <Text variant="caption" tone="error" style={{ marginTop: 16 }}>
                {error}
              </Text>
            ) : null}

            <View style={{ marginTop: 28 }}>
              <Button
                label="Continue"
                onPress={handleSignUp}
                loading={isLoading}
                disabled={disabled}
                fullWidth
              />
            </View>

            <Pressable
              onPress={() => router.replace('/(auth)/sign-in')}
              style={{ marginTop: 20, alignItems: 'center' }}
            >
              <Text variant="body" tone="secondary">
                Already have an account?{' '}
                <Text variant="bodyMedium" tone="accent">
                  Sign in
                </Text>
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text variant="title1" style={{ marginBottom: 8 }}>
              Enter the code
            </Text>
            <Text variant="body" tone="secondary" style={{ marginBottom: 28 }}>
              We emailed a 6-digit code to {email}.
            </Text>

            <Input
              label="Verification code"
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {error ? (
              <Text variant="caption" tone="error" style={{ marginTop: 16 }}>
                {error}
              </Text>
            ) : null}

            <View style={{ marginTop: 28 }}>
              <Button
                label="Verify & continue"
                onPress={handleVerify}
                loading={isLoading}
                disabled={code.length < 6 || isLoading}
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});