// app/(tabs)/_layout.tsx — Bottom tab bar.
//
// Guards match app/index.tsx exactly. We do NOT wait on profileLoading here —
// index.tsx already resolved the profile before navigating to (tabs), so
// the React Query cache has the data immediately on first render.

import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/src/components/ui/GlassSurface';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useMyProfile } from '@/src/hooks/useApi';

export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded } = useAuth();

  // Read from cache — do NOT block on isLoading
  const { data: profile } = useMyProfile(!!isSignedIn);

  const barHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
        tabBarStyle: {
          height: barHeight,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          position: 'absolute',
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1 }}>
            <GlassSurface absolute intensity={Platform.OS === 'ios' ? 70 : 0}>
              <View />
            </GlassSurface>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}