import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface StatCard {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/complaint/authority-stats');
      if (res.data?.status === 'success') setStats(res.data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const statCards: StatCard[] = [
    { title: 'Total Reports', value: stats?.total || 0, icon: 'list', color: '#4A9FF5', bgColor: '#EEF5FF' },
    { title: 'Pending', value: stats?.pending || 0, icon: 'time', color: '#FF9500', bgColor: '#FFF5E0' },
    { title: 'Resolved', value: stats?.resolved || 0, icon: 'checkmark-done', color: '#34C759', bgColor: '#F0FFF6' },
    { title: 'AI Confidence', value: `${stats?.avgConfidence || 0}%`, icon: 'flash', color: '#AF52DE', bgColor: '#F7F0FF' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} tintColor="#4A9FF5" />}
    >
      {/* Header Hero */}
      <View style={[styles.heroCard, { backgroundColor: '#4A9FF5' }]}>
        <View style={styles.heroBlob1} />
        <View style={styles.heroBlob2} />
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Welcome back,</Text>
            <Text style={styles.heroName}>{user?.userName || 'Authority'}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#4A9FF5" />
          </View>
        </View>
        <Text style={styles.heroDept}>
          {user?.userDepartment || 'General'} Department
        </Text>
        {stats?.pending > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={14} color="#FF9500" />
            <Text style={styles.alertBannerText}>
              {stats.pending} incident{stats.pending > 1 ? 's' : ''} awaiting action
            </Text>
          </View>
        )}
      </View>

      {/* Stat Cards */}
      <View style={styles.statsGrid}>
        {statCards.map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBox, { backgroundColor: s.bgColor }]}>
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
            <Text style={[styles.statTitle, { color: theme.secondary }]}>{s.title}</Text>
          </View>
        ))}
      </View>

      {/* AI Distribution */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Distribution</Text>
        <View style={[styles.distributionCard, { backgroundColor: theme.surface }]}>
          {stats?.confidenceDistribution?.length > 0 ? (
            stats.confidenceDistribution.map((item: any, i: number) => {
              const pct = Math.round((item.value / (stats.total || 1)) * 100);
              const barColors = ['#34C759', '#4A9FF5', '#FF9500', '#FF3B30'];
              return (
                <View key={i} style={{ marginBottom: 14 }}>
                  <View style={styles.distRow}>
                    <Text style={[styles.distLabel, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.distCount, { color: theme.secondary }]}>{item.value} reports</Text>
                  </View>
                  <View style={[styles.trackBg, { backgroundColor: theme.background }]}>
                    <View
                      style={[
                        styles.trackFill,
                        { width: `${pct}%`, backgroundColor: barColors[i % 4] },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={[styles.noDataText, { color: theme.secondary }]}>No distribution data yet</Text>
          )}
        </View>
      </View>

      {/* AI Insight */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <View style={[styles.insightCard, { backgroundColor: '#EEF5FF' }]}>
          <View style={styles.insightIcon}>
            <Ionicons name="bulb" size={22} color="#4A9FF5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>AI Insight</Text>
            <Text style={styles.insightText}>
              {stats?.pending > 5
                ? `${stats.pending} pending issues need attention. Prioritize Emergency & High cases first.`
                : `Great work! Resolution rate is healthy. Keep up the momentum!`}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  /* Hero */
  heroCard: {
    margin: 16,
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  heroBlob1: {
    position: 'absolute', top: -30, right: -30,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroBlob2: {
    position: 'absolute', bottom: -40, left: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  heroGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  heroName: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  heroBadge: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  heroDept: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 16 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  alertBannerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 10, marginBottom: 24,
  },
  statCard: {
    width: '47%', borderRadius: 20, padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  statIconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  statTitle: { fontSize: 13, fontWeight: '500' },
  /* Distribution */
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  distributionCard: {
    borderRadius: 22, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  distRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  distLabel: { fontSize: 14, fontWeight: '600' },
  distCount: { fontSize: 13 },
  trackBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4 },
  noDataText: { textAlign: 'center', padding: 20, fontSize: 14 },
  /* Insight */
  insightCard: {
    flexDirection: 'row', gap: 14, borderRadius: 20, padding: 18,
  },
  insightIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#D0E8FF', justifyContent: 'center', alignItems: 'center',
  },
  insightTitle: { color: '#4A9FF5', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  insightText: { color: '#4A5568', fontSize: 13, lineHeight: 20 },
});
