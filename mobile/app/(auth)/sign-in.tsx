// app/(auth)/sign-in.tsx

import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { SafeScreen } from '@/src/components/ui/SafeScreen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { Text } from '@/src/components/ui/Text';
import { haptics } from '@/src/utils/haptics';

export default function SignIn() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: createError } = await signIn.password({
        emailAddress: email,
        password,
      });

      if (createError) {
        setError(createError.longMessage ?? createError.message ?? 'Could not sign in.');
        haptics.error();
        return;
      }

      if (signIn.status === 'complete') {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          setError(finalizeError.longMessage ?? finalizeError.message ?? 'Could not complete sign in.');
          haptics.error();
          return;
        }
        haptics.success();
        router.replace('/');
      } else {
        setError(signIn.status);
      }
    } catch (e) {
      const err = e as { errors?: { message?: string }[]; message?: string };
      setError(err.errors?.[0]?.message ?? err.message ?? 'Could not sign in.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || fetchStatus === 'fetching';
  const disabled = !email || !password || isLoading;

  return (
    <SafeScreen keyboardAvoiding>
      <ScreenHeader title="Welcome back" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="title1" style={{ marginBottom: 8 }}>
          Sign in
        </Text>
        <Text variant="body" tone="secondary" style={{ marginBottom: 28 }}>
          Your matches and messages are waiting.
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
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {error ? (
          <Text variant="caption" tone="error" style={{ marginTop: 16 }}>
            {error}
          </Text>
        ) : null}

        <View style={{ marginTop: 28 }}>
          <Button
            label="Sign in"
            onPress={handleSignIn}
            loading={isLoading}
            disabled={disabled}
            fullWidth
          />
        </View>

        <Pressable
          onPress={() => router.replace('/(auth)/sign-up')}
          style={{ marginTop: 20, alignItems: 'center' }}
        >
          <Text variant="body" tone="secondary">
            New to Soullink?{' '}
            <Text variant="bodyMedium" tone="accent">
              Create account
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeScreen>
  );
}