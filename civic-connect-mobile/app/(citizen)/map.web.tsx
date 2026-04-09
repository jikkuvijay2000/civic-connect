import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Web Fallback for MapScreen
// map.tsx uses react-native-maps which relies on native mobile binaries
// and crashes the Expo Web bundler. This file seamlessly intercepts web requests.
export default function MapScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <View style={styles.webWarningContainer}>
        <Ionicons name="map" size={64} color="#888" />
        <Text style={styles.webWarningTitle}>Live Map Unvailable</Text>
        <Text style={styles.webWarningSubtitle}>
          The interactive incident map requires native GPS binaries and is only available on iOS and Android devices.
        </Text>
      </View>

      {/* Top Overlay */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>COMMAND CENTER</Text>
        <Text style={styles.headerSubtitle}>SYSTEM SYNCED</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  webWarningContainer: {
    alignItems: 'center',
    padding: 40,
  },
  webWarningTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
  },
  webWarningSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
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
  rescuePanel: {
    position: 'absolute',
    bottom: 40,
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
});
