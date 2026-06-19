import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import { Avatar, EmptyState, formatMoney } from '../components/ui';
import { RoommateApi, ChatApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../api/client';
import type { RoommatePost } from '../types';
import { colors, radius, spacing, shadow } from '../theme';

export default function RoommatesScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [items, setItems] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await RoommateApi.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function connect(post: RoommatePost) {
    if (post.user_id === user?.id) return Alert.alert('That’s your post 🙂');
    try {
      const conversationId = await ChatApi.start(post.user_id, null);
      nav.navigate('Chat', { conversationId, title: post.user.name });
    } catch (e) {
      Alert.alert('Could not start chat', apiError(e));
    }
  }

  return (
    <Screen
      title="Roommates"
      subtitle="Find someone to share with"
      right={
        <TouchableOpacity style={styles.addBtn} onPress={() => nav.navigate('CreateRoommate')}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      }
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(10) }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: spacing(6) }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Avatar uri={item.user.profile_image_url} name={item.user.name} />
                <View style={{ marginLeft: spacing(3), flex: 1 }}>
                  <Text style={styles.name}>{item.user.name}</Text>
                  <Text style={styles.meta}>{item.user.occupation || 'Seeker'}</Text>
                </View>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              <View style={styles.tagRow}>
                {item.preferred_location ? (
                  <Text style={styles.tag}>📍 {item.preferred_location}</Text>
                ) : null}
                {item.budget != null ? <Text style={styles.tag}>💰 {formatMoney(item.budget)}</Text> : null}
                {item.move_in_date ? <Text style={styles.tag}>📅 {item.move_in_date}</Text> : null}
              </View>
              <TouchableOpacity style={styles.connectBtn} onPress={() => connect(item)}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                <Text style={styles.connectText}>
                  {item.user_id === user?.id ? 'Your post' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState title="No roommate posts yet" subtitle="Be the first — tap + to create one." />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing(4), marginBottom: spacing(4), ...shadow },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(3) },
  name: { fontWeight: '700', color: colors.text, fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 13 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { color: colors.text, fontSize: 14, marginTop: spacing(1.5), lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(3) },
  tag: { backgroundColor: colors.bg, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: radius.pill, fontSize: 12, color: colors.text },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(2),
    marginTop: spacing(4), borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(2.5),
  },
  connectText: { color: colors.primary, fontWeight: '700' },
});
