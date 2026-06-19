import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { ChatApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import type { Message } from '../types';
import { colors, radius, spacing } from '../theme';

export default function ChatScreen() {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { conversationId } = route.params;
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial history load + mark read.
  useEffect(() => {
    (async () => {
      const history = await ChatApi.messages(conversationId);
      setMessages(history);
      ChatApi.markRead(conversationId).catch(() => {});
    })();
  }, [conversationId]);

  // Join the conversation room and subscribe to live events.
  useEffect(() => {
    if (!socket) return;
    socket.emit('conversation:join', { conversationId });

    const onNew = (m: Message) => {
      if (m.conversation_id !== conversationId) return;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      // If it's from the other person, mark read immediately (we're looking at it).
      if (m.sender_id !== user?.id) {
        socket.emit('message:read', { conversationId });
      }
    };
    const onRead = (p: { conversation_id: string; reader_id: string }) => {
      if (p.conversation_id !== conversationId) return;
      if (p.reader_id !== user?.id) {
        setMessages((prev) => prev.map((m) => (m.sender_id === user?.id ? { ...m, is_read: true } : m)));
      }
    };
    const onTyping = (p: { conversation_id: string; user_id: string; isTyping: boolean }) => {
      if (p.conversation_id === conversationId && p.user_id !== user?.id) setOtherTyping(p.isTyping);
    };

    socket.on('message:new', onNew);
    socket.on('message:read', onRead);
    socket.on('typing', onTyping);

    return () => {
      socket.emit('conversation:leave', { conversationId });
      socket.off('message:new', onNew);
      socket.off('message:read', onRead);
      socket.off('typing', onTyping);
    };
  }, [socket, conversationId, user?.id]);

  const send = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    setText('');
    if (socket) {
      socket.emit('message:send', { conversationId, content }, (ack: any) => {
        // Fallback to REST if the socket send failed.
        if (!ack?.ok) ChatApi.send(conversationId, content).then((m) => setMessages((p) => [...p, m]));
      });
    } else {
      ChatApi.send(conversationId, content).then((m) => setMessages((p) => [...p, m]));
    }
  }, [text, socket, conversationId]);

  const onChangeText = (v: string) => {
    setText(v);
    if (!socket) return;
    socket.emit('typing', { conversationId, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing', { conversationId, isTyping: false }), 1200);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(2) }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.msgText, mine && { color: colors.white }]}>{item.content}</Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaTime, mine && { color: 'rgba(255,255,255,0.8)' }]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {mine && (
                    <Ionicons
                      name={item.is_read ? 'checkmark-done' : 'checkmark'}
                      size={14}
                      color={item.is_read ? '#A7F3D0' : 'rgba(255,255,255,0.8)'}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {otherTyping && <Text style={styles.typing}>typing…</Text>}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing(2) }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={onChangeText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', marginBottom: spacing(2) },
  bubble: { maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: spacing(3.5), paddingVertical: spacing(2.5) },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msgText: { fontSize: 15, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing(1) },
  metaTime: { fontSize: 10, color: colors.textMuted },
  typing: { color: colors.textMuted, fontStyle: 'italic', paddingHorizontal: spacing(5), marginBottom: spacing(1) },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing(2),
    paddingHorizontal: spacing(3), paddingTop: spacing(2),
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, maxHeight: 120, backgroundColor: colors.bg, borderRadius: radius.lg,
    paddingHorizontal: spacing(4), paddingVertical: spacing(2.5), fontSize: 15, color: colors.text,
  },
  sendBtn: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
