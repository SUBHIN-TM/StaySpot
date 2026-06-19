import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import PropertyCard from '../components/PropertyCard';
import { EmptyState } from '../components/ui';
import { PropertyApi } from '../api';
import type { Property } from '../types';
import { colors, radius, spacing } from '../theme';

const TYPES = ['all', 'room', 'apartment', 'house', 'pg', 'hostel', 'shared'];

export default function ExploreScreen() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<Property[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await PropertyApi.list({
        q: q || undefined,
        property_type: type === 'all' ? undefined : type,
      });
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, type]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen title="Explore" subtitle="Find your next stay">
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Search by title, area, address…"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={load}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {q.length > 0 && (
          <TouchableOpacity onPress={() => { setQ(''); }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={TYPES}
        keyExtractor={(t) => t}
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44, marginBottom: spacing(2) }}
        contentContainerStyle={{ gap: spacing(2), paddingVertical: spacing(1) }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setType(item)}
            style={[styles.chip, type === item && styles.chipActive]}
          >
            <Text style={[styles.chipText, type === item && { color: colors.white }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(10) }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing(6) }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <PropertyCard property={item} onPress={() => nav.navigate('PropertyDetail', { id: item.id })} />
          )}
          ListEmptyComponent={
            <EmptyState title="No properties found" subtitle="Try a different search or filter." />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(2),
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing(3.5), marginBottom: spacing(3),
  },
  searchInput: { flex: 1, paddingVertical: spacing(3), color: colors.text, fontSize: 15 },
  chip: {
    paddingHorizontal: spacing(4), paddingVertical: spacing(2), borderRadius: radius.pill,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
});
