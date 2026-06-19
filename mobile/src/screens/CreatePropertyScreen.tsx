import React, { useRef, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, Field } from '../components/ui';
import { PropertyApi } from '../api';
import { apiError } from '../api/client';
import { colors, radius, spacing } from '../theme';

const TYPES = ['room', 'apartment', 'house', 'pg', 'hostel', 'shared'];
const DEFAULT_REGION: Region = { latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function CreatePropertyScreen() {
  const nav = useNavigation<any>();
  const [form, setForm] = useState({
    title: '', description: '', rent_amount: '', address: '', district: '', city: '',
  });
  const [type, setType] = useState('room');
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const centerRef = useRef<Region>(DEFAULT_REGION);
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function pickImages() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to add images.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 10,
    });
    if (!res.canceled) setImages((prev) => [...prev, ...res.assets].slice(0, 10));
  }

  function dropPin() {
    setPin({ latitude: centerRef.current.latitude, longitude: centerRef.current.longitude });
  }

  async function submit() {
    if (!form.title.trim()) return Alert.alert('Title required');
    setLoading(true);
    try {
      const property = await PropertyApi.create({
        title: form.title.trim(),
        description: form.description || undefined,
        property_type: type,
        rent_amount: form.rent_amount ? Number(form.rent_amount) : 0,
        address: form.address || undefined,
        district: form.district || undefined,
        city: form.city || undefined,
        latitude: pin?.latitude,
        longitude: pin?.longitude,
      } as any);

      if (images.length) {
        const fd = new FormData();
        images.forEach((img, i) => {
          const name = img.fileName || `photo_${i}.jpg`;
          const typeGuess = img.mimeType || 'image/jpeg';
          // React Native FormData file shape:
          fd.append('images', { uri: img.uri, name, type: typeGuess } as any);
        });
        await PropertyApi.uploadImages(property.id, fd);
      }
      Alert.alert('Listing created 🎉');
      nav.goBack();
    } catch (e) {
      Alert.alert('Could not create listing', apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(12) }}>
      <Field label="Title" placeholder="Cozy 1BHK near…" value={form.title} onChangeText={set('title')} />
      <Field label="Description" placeholder="Describe the place" value={form.description} onChangeText={set('description')} multiline style={{ minHeight: 90, textAlignVertical: 'top' }} />

      <Text style={styles.label}>Property type</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t} onPress={() => setType(t)} style={[styles.typeChip, type === t && styles.typeChipActive]}>
            <Text style={[styles.typeText, type === t && { color: colors.white }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field label="Rent (₹/month)" placeholder="15000" keyboardType="numeric" value={form.rent_amount} onChangeText={set('rent_amount')} />
      <Field label="Address" placeholder="Street / building" value={form.address} onChangeText={set('address')} />
      <Field label="District" placeholder="Koramangala" value={form.district} onChangeText={set('district')} />
      <Field label="City" placeholder="Bengaluru" value={form.city} onChangeText={set('city')} />

      <Text style={styles.label}>Drop a location pin (move map, then tap)</Text>
      <View style={styles.mapWrap}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={{ flex: 1 }}
          initialRegion={DEFAULT_REGION}
          onRegionChangeComplete={(r) => (centerRef.current = r)}
        >
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} zIndex={-1} />
          {pin && <Marker coordinate={pin} pinColor={colors.primary} />}
        </MapView>
        <View pointerEvents="none" style={styles.crosshair}><View style={styles.crosshairDot} /></View>
        <TouchableOpacity style={styles.pinBtn} onPress={dropPin}>
          <Ionicons name="location" size={16} color={colors.white} />
          <Text style={styles.pinBtnText}>{pin ? 'Update pin' : 'Set pin here'}</Text>
        </TouchableOpacity>
      </View>
      {pin && <Text style={styles.coords}>📍 {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}</Text>}

      <Text style={styles.label}>Photos ({images.length}/10)</Text>
      <View style={styles.imageRow}>
        {images.map((img, i) => (
          <View key={i} style={styles.thumbWrap}>
            <Image source={{ uri: img.uri }} style={styles.thumb} />
            <TouchableOpacity style={styles.removeThumb} onPress={() => setImages((p) => p.filter((_, idx) => idx !== i))}>
              <Ionicons name="close" size={12} color={colors.white} />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 10 && (
          <TouchableOpacity style={styles.addThumb} onPress={pickImages}>
            <Ionicons name="add" size={26} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Button title="Create Listing" onPress={submit} loading={loading} style={{ marginTop: spacing(5) }} />
      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(3) }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontWeight: '600', marginBottom: spacing(2), marginTop: spacing(2), fontSize: 13 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(4) },
  typeChip: { paddingHorizontal: spacing(3.5), paddingVertical: spacing(2), borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: 13, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  mapWrap: { height: 220, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  crosshair: { position: 'absolute', top: '50%', left: '50%', marginLeft: -6, marginTop: -6 },
  crosshairDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.white },
  pinBtn: {
    position: 'absolute', bottom: spacing(3), alignSelf: 'center', flexDirection: 'row', gap: spacing(2),
    backgroundColor: colors.primary, paddingHorizontal: spacing(4), paddingVertical: spacing(2.5), borderRadius: radius.pill, alignItems: 'center',
  },
  pinBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  coords: { color: colors.textMuted, fontSize: 12, marginTop: spacing(2) },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  thumbWrap: { width: 80, height: 80 },
  thumb: { width: 80, height: 80, borderRadius: radius.md },
  removeThumb: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.danger, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addThumb: { width: 80, height: 80, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
