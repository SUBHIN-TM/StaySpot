import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import { Avatar, EmptyState } from '../components/ui';
import { ChatApi } from '../api';
import { useSocket } from '../context/SocketContext';
import type { Conversation } from '../types';
import { colors, spacing } from '../theme';

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ChatsScreen() {
  const nav = useNavigation<any>();
  const { socket } = useSocket();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await ChatApi.conversations());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Refresh the list whenever a new message arrives anywhere.
  useEffect(() => {
    if (!socket) return;
    const onNew = () => load();
    socket.on('message:new', onNew);
    return () => { socket.off('message:new', onNew); };
  }, [socket, load]);

  return (
    <Screen title="Chats" subtitle="Your conversations">
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(10) }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: spacing(6) }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => nav.navigate('Chat', { conversationId: item.id, title: item.other_user.name })}
            >
              <Avatar uri={item.other_user.profile_image_url} name={item.other_user.name} size={50} />
              <View style={{ flex: 1, marginLeft: spacing(3) }}>
                <View style={styles.topLine}>
                  <Text style={styles.name} numberOfLines={1}>{item.other_user.name}</Text>
                  <Text style={styles.time}>{timeAgo(item.last_message?.created_at)}</Text>
                </View>
                <View style={styles.bottomLine}>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.property ? `🏠 ${item.property.title} · ` : ''}
                    {item.last_message?.content || 'Say hello 👋'}
                  </Text>
                  {item.unread_count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No chats yet"
              subtitle="Message a property owner or a roommate to start a conversation."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3), borderBottomWidth: 1, borderBottomColor: colors.border },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '700', color: colors.text, fontSize: 15, flex: 1, marginRight: spacing(2) },
  time: { color: colors.textMuted, fontSize: 12 },
  bottomLine: { flexDirection: 'row', alignItems: 'center', marginTop: spacing(1) },
  preview: { color: colors.textMuted, fontSize: 13, flex: 1, marginRight: spacing(2) },
  badge: { backgroundColor: colors.primary, borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
