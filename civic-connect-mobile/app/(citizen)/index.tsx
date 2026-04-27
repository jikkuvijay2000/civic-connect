import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  StyleSheet, Image, Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

const FILTERS = ['All Alerts', 'Pothole', 'Streetlight', 'Water Leak', 'Garbage', 'Drainage', 'Other'];

const PRIORITY_COLORS: Record<string, string> = {
  Emergency: '#FF3B30',
  High: '#FF9500',
  Medium: '#4A9FF5',
  Low: '#34C759',
};

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All Alerts');
  const router = useRouter();

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/complaint/my-contributions');
      if (res.data?.status === 'success') {
        setComplaints(res.data.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const filtered =
    activeFilter === 'All Alerts'
      ? complaints
      : complaints.filter(
          (c) => c.complaintType === activeFilter || c.category === activeFilter,
        );

  const getTitle = (c: any) =>
    c.complaintDescription?.split('\n')[0]?.replace(/\*\*/g, '') ||
    c.complaintTitle ||
    'Civic Alert';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchDashboard} tintColor="#FF6B35" />
      }
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBox, { backgroundColor: '#FFF0E8' }]}>
            <Ionicons name="shield-checkmark" size={18} color="#FF6B35" />
          </View>
          <View>
            <Text style={[styles.brandName, { color: theme.text }]}>Civic Connect</Text>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={[styles.liveLabel, { color: theme.secondary }]}>Alert Citywide · Live</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.avatarCircle, { backgroundColor: '#FF6B35' }]}
          onPress={() => router.push('/(citizen)/profile')}
        >
          <Text style={styles.avatarText}>{user?.userName?.[0]?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Hero Text ─── */}
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: theme.text }]}>
          What's Happening{'\n'}Nearby,{' '}
          <Text style={styles.heroOrange}>Civic{'\n'}Alerts</Text>
        </Text>
      </View>

      {/* ─── Featured Live Card ─── */}
      {complaints.length > 0 && (
        <View style={[styles.featuredCard, { backgroundColor: theme.heroBackground }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>Live update</Text>
            </View>
            <Text style={[styles.featuredTitle, { color: theme.text }]} numberOfLines={2}>
              {getTitle(complaints[0])}
            </Text>
            <Text style={[styles.featuredDate, { color: theme.secondary }]}>
              {new Date(complaints[0].createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          {complaints[0].complaintImage ? (
            <Image source={{ uri: complaints[0].complaintImage }} style={styles.featuredThumb} />
          ) : (
            <View style={[styles.featuredThumb, { backgroundColor: '#FF6B3520', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="alert-circle" size={32} color="#FF6B35" />
            </View>
          )}
        </View>
      )}

      {/* ─── Filter Chips ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 20 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[
              styles.chip,
              { borderColor: activeFilter === f ? '#FF6B35' : theme.border },
              activeFilter === f && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: activeFilter === f ? '#fff' : theme.secondary },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── Card Grid ─── */}
      <View style={styles.grid}>
        {filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={52}
              color="#FF6B35"
              style={{ opacity: 0.4, marginBottom: 14 }}
            />
            <Text style={{ color: theme.secondary, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
              No incidents reported yet.{'\n'}Your area looks safe! 🎉
            </Text>
          </View>
        ) : (
          filtered.map((c, i) => {
            const pColor = PRIORITY_COLORS[c.complaintPriority] || '#4A9FF5';
            const bgColors = ['#FFF0E8', '#EEF5FF', '#F0FFF6', '#F5F0FF'];
            return (
              <View
                key={c._id}
                style={[
                  styles.gridCard,
                  i % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
                ]}
              >
                {c.complaintImage ? (
                  <>
                    <Image
                      source={{ uri: c.complaintImage }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                    <View style={styles.gridOverlay}>
                      <View style={[styles.badge, { backgroundColor: pColor }]}>
                        <Text style={styles.badgeText}>{c.complaintPriority || 'Medium'}</Text>
                      </View>
                      <Text style={styles.gridCardTitle} numberOfLines={2}>
                        {getTitle(c)}
                      </Text>
                      <View style={styles.gridStats}>
                        <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.gridStatText}>
                          {Math.floor(Math.random() * 400 + 80)}
                        </Text>
                        <Ionicons name="heart-outline" size={12} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.gridStatText}>{Math.floor(Math.random() * 50 + 5)}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={[styles.gridNoImage, { backgroundColor: bgColors[i % 4] }]}>
                    <View style={[styles.badge, { backgroundColor: pColor, alignSelf: 'flex-start' }]}>
                      <Text style={styles.badgeText}>{c.complaintPriority || 'Medium'}</Text>
                    </View>
                    <Text style={[styles.gridCardTitleDark, { color: theme.text }]} numberOfLines={3}>
                      {getTitle(c)}
                    </Text>
                    <Text style={{ color: theme.secondary, fontSize: 11, marginTop: 'auto' as any }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: { fontSize: 16, fontWeight: '700' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34C759' },
  liveLabel: { fontSize: 11 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  /* Hero */
  heroSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  heroTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, lineHeight: 42 },
  heroOrange: { color: '#FF6B35', fontStyle: 'italic' },
  /* Featured */
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74,159,245,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  livePillText: { color: '#4A9FF5', fontSize: 12, fontWeight: '700' },
  featuredTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 6 },
  featuredDate: { fontSize: 12 },
  featuredThumb: { width: 80, height: 80, borderRadius: 16 },
  /* Chips */
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  chipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  chipText: { fontSize: 13, fontWeight: '600' },
  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  gridCard: {
    width: CARD_W,
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F0F0F5',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  gridNoImage: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-start',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  gridCardTitle: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  gridCardTitleDark: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  gridStatText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginRight: 6 },
  /* Empty */
  emptyCard: {
    flex: 1,
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    margin: 16,
  },
});
