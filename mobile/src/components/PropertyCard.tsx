import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';
import { Badge, formatMoney } from './ui';
import type { Property } from '../types';

export default function PropertyCard({
  property, onPress,
}: {
  property: Property; onPress: () => void;
}) {
  const cover = property.images?.[0]?.image_url;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={styles.imageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ color: colors.textMuted }}>No photo</Text>
          </View>
        )}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{formatMoney(property.rent_amount)}/mo</Text>
        </View>
      </View>
      <View style={{ padding: spacing(3) }}>
        <Text numberOfLines={1} style={styles.title}>{property.title}</Text>
        <Text numberOfLines={1} style={styles.location}>
          {[property.address, property.city].filter(Boolean).join(', ') || 'Location not set'}
        </Text>
        <View style={styles.row}>
          <Badge text={property.property_type} />
          {typeof property.distance_km === 'number' && (
            <Text style={styles.distance}>{property.distance_km.toFixed(1)} km away</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing(4),
    overflow: 'hidden',
    ...shadow,
  },
  imageWrap: { height: 170, backgroundColor: colors.border },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  priceTag: {
    position: 'absolute', bottom: spacing(2.5), left: spacing(2.5),
    backgroundColor: colors.primary, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5),
    borderRadius: radius.pill,
  },
  priceText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  location: { fontSize: 13, color: colors.textMuted, marginTop: spacing(1) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing(2.5) },
  distance: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});
