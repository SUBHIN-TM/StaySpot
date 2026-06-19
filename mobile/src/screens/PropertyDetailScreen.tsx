import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PropertyApi, ChatApi, FavoriteApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, Button, formatMoney } from '../components/ui';
import { apiError } from '../api/client';
import type { Property } from '../types';
import { colors, radius, spacing } from '../theme';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const { id } = route.params;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    PropertyApi.get(id)
      .then(setProperty)
      .catch((e) => Alert.alert('Error', apiError(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleFav() {
    try {
      if (fav) await FavoriteApi.remove(id);
      else await FavoriteApi.add(id);
      setFav(!fav);
    } catch (e) {
      Alert.alert('Error', apiError(e));
    }
  }

  async function messageOwner() {
    if (!property) return;
    if (property.owner_id === user?.id) return Alert.alert('That’s your listing 🙂');
    setStarting(true);
    try {
      const conversationId = await ChatApi.start(property.owner_id, property.id);
      nav.navigate('Chat', { conversationId, title: property.owner.name });
    } catch (e) {
      Alert.alert('Could not start chat', apiError(e));
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;
  if (!property) return <View style={{ flex: 1 }} />;

  const hasGeo = property.latitude != null && property.longitude != null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(28) }}>
        {/* Image gallery */}
        {property.images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {property.images.map((img) => (
              <Image key={img.id} source={{ uri: img.image_url }} style={{ width, height: 260 }} />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.noImage, { width, height: 220 }]}>
            <Ionicons name="image-outline" size={40} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 6 }}>No photos yet</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{property.title}</Text>
            <TouchableOpacity onPress={toggleFav}>
              <Ionicons name={fav ? 'heart' : 'heart-outline'} size={26} color={fav ? colors.danger : colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.price}>{formatMoney(property.rent_amount)} <Text style={styles.perMonth}>/ month</Text></Text>

          <View style={styles.metaRow}>
            <Badge text={property.property_type} />
            {property.is_available ? <Badge text="Available" color={colors.success} /> : <Badge text="Unavailable" color={colors.danger} />}
          </View>

          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />{' '}
            {[property.address, property.district, property.city].filter(Boolean).join(', ') || 'Location not specified'}
          </Text>

          {property.description ? (
            <>
              <Text style={styles.sectionTitle}>About this place</Text>
              <Text style={styles.description}>{property.description}</Text>
            </>
          ) : null}

          {/* Owner */}
          <Text style={styles.sectionTitle}>Hosted by</Text>
          <View style={styles.ownerRow}>
            <Avatar uri={property.owner.profile_image_url} name={property.owner.name} />
            <View style={{ marginLeft: spacing(3) }}>
              <Text style={styles.ownerName}>{property.owner.name}</Text>
              <Text style={styles.ownerMeta}>{property.owner.occupation || 'Property owner'}</Text>
            </View>
          </View>

          {/* Map */}
          {hasGeo && (
            <>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.mapWrap}>
                <MapView
                  provider={PROVIDER_DEFAULT}
                  style={{ flex: 1 }}
                  pointerEvents="none"
                  initialRegion={{
                    latitude: property.latitude!,
                    longitude: property.longitude!,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} zIndex={-1} />
                  <Marker coordinate={{ latitude: property.latitude!, longitude: property.longitude! }} pinColor={colors.primary} />
                </MapView>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        <Button
          title={property.owner_id === user?.id ? 'This is your listing' : 'Message Owner'}
          onPress={messageOwner}
          loading={starting}
          disabled={property.owner_id === user?.id}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noImage: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing(4) },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1, marginRight: spacing(3) },
  price: { fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: spacing(2) },
  perMonth: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  metaRow: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) },
  location: { fontSize: 14, color: colors.textMuted, marginTop: spacing(3) },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing(6), marginBottom: spacing(2) },
  description: { fontSize: 14, color: colors.text, lineHeight: 21 },
  ownerRow: { flexDirection: 'row', alignItems: 'center' },
  ownerName: { fontWeight: '700', color: colors.text, fontSize: 15 },
  ownerMeta: { color: colors.textMuted, fontSize: 13 },
  mapWrap: { height: 180, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing(4),
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
