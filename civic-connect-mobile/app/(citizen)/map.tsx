import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MapScreen() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  const fetchMapPoints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/complaint/map-points');
      if (res.data?.status === 'success') {
        setPoints(res.data.data);
      }
    } catch (err) {
      console.log('Failed to fetch map points');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapPoints();
  }, [fetchMapPoints]);

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: 12.9716,
          longitude: 77.5946,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: 12.9716, longitude: 77.5946 }}>
          <View style={styles.userMarkerContainer}>
            <View style={styles.userMarkerOuter}>
               <View style={styles.userMarkerInner} />
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Top Overlay */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>COMMAND CENTER</Text>
        <Text style={styles.headerSubtitle}>SYSTEM SYNCED</Text>
      </View>

      <TouchableOpacity style={styles.scanButton}>
        <Ionicons name="scan-outline" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Info Cards */}
      <View style={styles.infoCardsRow}>
        <View style={styles.infoCard}>
          <Text style={styles.cardLabel}>NEARBY{"\n"}INCIDENTS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.cardValue}>1</Text>
            <Text style={styles.cardUnit}>ACTIVE</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { alignItems: 'flex-end' }]}>
          <Text style={styles.cardLabel}>SAFETY</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={[styles.cardValue, { color: theme.accent }]}>100</Text>
            <Text style={[styles.cardUnit, { color: theme.accent }]}>%</Text>
          </View>
        </View>
      </View>

      {/* Rescue Panel */}
      <View style={styles.rescuePanel}>
        <Text style={styles.rescueTitle}>Need Rescue?</Text>
        <Text style={styles.rescueSubtitle}>Report an incident and dispatch help{"\n"}instantly.</Text>
        
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => router.push('/(citizen)/report')}
        >
          <Text style={styles.reportButtonText}>REPORT INCIDENT</Text>
          <Ionicons name="flash" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#222222" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#111111" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#050505" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width: '100%', height: '100%' },
  headerOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  headerTitle: {
    color: '#D4FF00',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  scanButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoCardsRow: {
    position: 'absolute',
    bottom: 240,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  cardValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  cardUnit: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '900',
  },
  rescuePanel: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rescueTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  rescueSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  reportButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    gap: 12,
  },
  reportButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  userMarkerContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4FF00',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4FF00',
  }
});
