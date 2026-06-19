import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT, Region, Circle } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { PropertyApi } from '../api';
import type { Property } from '../types';
import { formatMoney } from '../components/ui';
import { colors, radius, spacing, shadow } from '../theme';

// Default center: Bengaluru (matches seed data). Users pan to their own city.
const DEFAULT_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const RADII = [2, 5, 10, 20];

export default function MapScreen() {
  const nav = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);
  const centerRef = useRef<Region>(DEFAULT_REGION);
  const [results, setResults] = useState<Property[]>([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    const c = centerRef.current;
    setLoading(true);
    try {
      const data = await PropertyApi.list({
        lat: c.latitude,
        lng: c.longitude,
        radius_km: radiusKm,
        limit: 50,
      });
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [radiusKm]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={(r) => (centerRef.current = r)}
        showsUserLocation
      >
        {/* OpenStreetMap raster tiles — 100% free, no API key (per PRD). */}
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} zIndex={-1} />

        <Circle
          center={{ latitude: centerRef.current.latitude, longitude: centerRef.current.longitude }}
          radius={radiusKm * 1000}
          strokeColor={colors.primary}
          fillColor={'rgba(15,118,110,0.08)'}
        />

        {results.map((p) =>
          p.latitude != null && p.longitude != null ? (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              title={p.title}
              description={`${formatMoney(p.rent_amount)}/mo`}
              pinColor={colors.primary}
              onCalloutPress={() => nav.navigate('PropertyDetail', { id: p.id })}
            />
          ) : null
        )}
      </MapView>

      {/* Center crosshair indicating the search origin */}
      <View pointerEvents="none" style={styles.crosshair}>
        <View style={styles.crosshairDot} />
      </View>

      <View style={styles.topCard}>
        <Text style={styles.topTitle}>Search this area</Text>
        <View style={styles.radiusRow}>
          {RADII.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRadiusKm(r)}
              style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
            >
              <Text style={[styles.radiusText, radiusKm === r && { color: colors.white }]}>{r} km</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={search} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.searchBtnText}>
              {searched ? `Search again (${results.length} found)` : 'Search here'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topCard: {
    position: 'absolute', top: spacing(12), left: spacing(4), right: spacing(4),
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing(4), ...shadow,
  },
  topTitle: { fontWeight: '800', fontSize: 16, color: colors.text, marginBottom: spacing(3) },
  radiusRow: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(3) },
  radiusChip: {
    flex: 1, paddingVertical: spacing(2), borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center',
  },
  radiusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radiusText: { fontSize: 13, fontWeight: '600', color: colors.text },
  searchBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3),
    alignItems: 'center',
  },
  searchBtnText: { color: colors.white, fontWeight: '700' },
  crosshair: {
    position: 'absolute', top: '50%', left: '50%', marginLeft: -6, marginTop: -6,
  },
  crosshairDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary,
    borderWidth: 2, borderColor: colors.white,
  },
});
