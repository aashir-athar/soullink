// src/components/ui/SearchableSelect.tsx — Searchable dropdown via BottomSheet.

import { Ionicons } from '@expo/vector-icons';
import React, { memo, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/src/contexts/ThemeContext';
import { BottomSheet } from './BottomSheet';
import { Divider } from './Divider';
import { Text } from './Text';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  searchable?: boolean;
  disabled?: boolean;
}

function SearchableSelectBase({
  label,
  placeholder = 'Select...',
  value,
  options,
  onChange,
  searchable = true,
  disabled = false,
}: Props) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ width: '100%' }}>
      {label ? (
        <Text
          variant="captionMedium"
          tone="secondary"
          style={{ marginBottom: 6, marginLeft: 4 }}
        >
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        disabled={disabled}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        <Text
          variant="bodyLarge"
          tone={selected ? 'primary' : 'tertiary'}
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.colors.textSecondary}
        />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          {label ? (
            <Text variant="title3" style={{ marginBottom: 14 }}>
              {label}
            </Text>
          ) : null}
          {searchable ? (
            <View
              style={[
                styles.searchField,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radii.pill,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={18}
                color={theme.colors.textTertiary}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor={theme.colors.textTertiary}
                style={[
                  styles.searchInput,
                  {
                    color: theme.colors.text,
                    ...theme.typography.body,
                  },
                ]}
                autoCorrect={false}
              />
            </View>
          ) : null}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.value}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onChange(item.value);
                setOpen(false);
                setQuery('');
              }}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: pressed
                    ? theme.colors.surfaceMuted
                    : 'transparent',
                },
              ]}
            >
              <Text
                variant="bodyLarge"
                tone={item.value === value ? 'accent' : 'primary'}
              >
                {item.label}
              </Text>
              {item.value === value ? (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={theme.colors.primary}
                />
              ) : null}
            </Pressable>
          )}
          ItemSeparatorComponent={Divider}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 6,
  },
  searchInput: { flex: 1, padding: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});

export const SearchableSelect = memo(SearchableSelectBase);
