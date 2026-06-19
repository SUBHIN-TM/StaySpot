import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import PropertyCard from '../components/PropertyCard';
import { Avatar, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { PropertyApi, UserApi } from '../api';
import { apiError } from '../api/client';
import type { Property } from '../types';
import { colors, radius, spacing } from '../theme';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { user, signOut, setUser } = useAuth();
  const [myListings, setMyListings] = useState<Property[]>([]);
  const [uploading, setUploading] = useState(false);
  const isOwner = user?.role === 'owner';

  const loadListings = useCallback(async () => {
    if (!user || !isOwner) return;
    try {
      setMyListings(await PropertyApi.list({ owner_id: user.id, limit: 50 }));
    } catch {
      /* ignore */
    }
  }, [user, isOwner]);

  useFocusEffect(useCallback(() => { loadListings(); }, [loadListings]));

  async function changeAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled) return;
    const img = res.assets[0];
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', { uri: img.uri, name: img.fileName || 'avatar.jpg', type: img.mimeType || 'image/jpeg' } as any);
      const updated = await UserApi.uploadAvatar(fd);
      setUser(updated);
    } catch (e) {
      Alert.alert('Upload failed', apiError(e));
    } finally {
      setUploading(false);
    }
  }

  if (!user) return null;

  return (
    <Screen title="Profile">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing(8) }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={changeAvatar}>
            <Avatar uri={user.profile_image_url} name={user.name} size={84} />
            <View style={styles.cameraBadge}>
              {uploading ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="camera" size={14} color={colors.white} />}
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role === 'owner' ? 'Property Owner' : 'Seeker'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Row icon="briefcase-outline" label="Occupation" value={user.occupation || '—'} />
          <Row icon="call-outline" label="Mobile" value={user.mobile_number || '—'} />
          <Row icon="male-female-outline" label="Gender" value={user.gender || '—'} />
        </View>

        {isOwner && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>My Listings ({myListings.length})</Text>
              <TouchableOpacity style={styles.newBtn} onPress={() => nav.navigate('CreateProperty')}>
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.newBtnText}>New</Text>
              </TouchableOpacity>
            </View>
            {myListings.length === 0 ? (
              <Text style={styles.emptyText}>No listings yet. Tap “New” to add one.</Text>
            ) : (
              myListings.map((p) => (
                <PropertyCard key={p.id} property={p} onPress={() => nav.navigate('PropertyDetail', { id: p.id })} />
              ))
            )}
          </>
        )}

        <Button title="Log Out" variant="outline" onPress={signOut} style={{ marginTop: spacing(6) }} />
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing(2), marginBottom: spacing(5) },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary,
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg,
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: spacing(3) },
  email: { fontSize: 13, color: colors.textMuted, marginTop: spacing(1) },
  roleBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: radius.pill, marginTop: spacing(2) },
  roleText: { color: colors.primaryDark, fontWeight: '700', fontSize: 12 },
  infoCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3), paddingHorizontal: spacing(2) },
  rowLabel: { marginLeft: spacing(3), color: colors.textMuted, fontSize: 14 },
  rowValue: { marginLeft: 'auto', color: colors.text, fontWeight: '600', fontSize: 14 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing(6), marginBottom: spacing(3) },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), backgroundColor: colors.primary, paddingHorizontal: spacing(3), paddingVertical: spacing(2), borderRadius: radius.pill },
  newBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  emptyText: { color: colors.textMuted, fontSize: 13, marginBottom: spacing(4) },
});
