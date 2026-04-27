import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

const ACHIEVEMENTS = [
  { title: 'First Alert', icon: 'alert-circle' as const, color: '#FF9500', threshold: 1, field: 'totalComplaints' },
  { title: 'Active Citizen', icon: 'shield-checkmark' as const, color: '#4A9FF5', threshold: 5, field: 'totalComplaints' },
  { title: 'Community Helper', icon: 'people' as const, color: '#34C759', threshold: 3, field: 'resolvedComplaints' },
  { title: 'Safety Champion', icon: 'trophy' as const, color: '#AF52DE', threshold: 10, field: 'totalComplaints' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const fetchStats = useCallback(async () => {
    try {
      const res = await client.get('/user/stats');
      if (res.data?.status === 'success') setStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const total = stats?.totalComplaints || 0;
  const resolved = stats?.resolvedComplaints || 0;
  const completePct = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const earnedBadges = ACHIEVEMENTS.filter((a) => {
    const val = a.field === 'resolvedComplaints' ? resolved : total;
    return val >= a.threshold;
  });

  const month = new Date().toLocaleString('default', { month: 'long' });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile Hero ── */}
      <View style={[styles.heroSection, { backgroundColor: theme.heroBackground }]}>
        {/* Blobs */}
        <View style={styles.blobTR} />
        <View style={styles.blobBL} />

        <View style={styles.avatarRing}>
          <Text style={styles.avatarLetter}>{user?.userName?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={[styles.heroName, { color: theme.text }]}>{user?.userName || 'User'}</Text>
        <Text style={[styles.heroHandle, { color: theme.secondary }]}>
          @{user?.userEmail?.split('@')[0] || 'user'}
        </Text>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: theme.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#FF6B35' }]}>{total}</Text>
            <Text style={[styles.statLabel, { color: theme.secondary }]}>Alert Post</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <View style={styles.avatarSmall}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#4A9FF5' }]}>{completePct}%</Text>
            <Text style={[styles.statLabel, { color: theme.secondary }]}>Complete</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 20 }}>

        {/* ── Achievements ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>My Achievements</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.badgeRow}>
            {ACHIEVEMENTS.map((a, i) => {
              const earned = earnedBadges.find((e) => e.title === a.title);
              return (
                <View
                  key={i}
                  style={[
                    styles.badge,
                    {
                      backgroundColor: earned ? a.color + '22' : 'rgba(0,0,0,0.04)',
                      borderColor: earned ? a.color + '55' : 'transparent',
                      opacity: earned ? 1 : 0.35,
                    },
                  ]}
                >
                  <Ionicons name={a.icon} size={22} color={earned ? a.color : '#8E8E93'} />
                  {earned && (
                    <View style={[styles.badgeCheckmark, { backgroundColor: a.color }]}>
                      <Ionicons name="checkmark" size={8} color="#fff" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          <Text style={[styles.achieveDesc, { color: theme.secondary }]}>
            Achieve badges by alerting your community of any incidents or good vibes
          </Text>
        </View>

        {/* ── Monthly Challenge ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly Challenge</Text>
        <View style={[styles.challengeCard, { backgroundColor: theme.surface }]}>
          <View style={styles.challengeIconWrap}>
            <Ionicons name="trophy" size={26} color="#FF9500" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.challengeTitle, { color: theme.text }]}>{month} Challenge</Text>
            <Text style={{ color: theme.secondary, fontSize: 13, lineHeight: 19 }}>
              Alert your community 1 time to achieve{' '}
              <Text style={{ color: '#4A9FF5', fontWeight: '700' }}>Community Helper</Text>
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.secondary} />
        </View>

        {/* ── Account Info ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, padding: 0, overflow: 'hidden' }]}>
          {[
            { icon: 'mail-outline', label: user?.userEmail || '—' },
            { icon: 'id-card-outline', label: user?.userRole || 'Citizen' },
            { icon: 'star', label: `${user?.rewardPoints || 0} Civic Points`, color: '#FF9500' },
          ].map((row, i, arr) => (
            <View
              key={i}
              style={[
                styles.infoRow,
                { borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: theme.border },
              ]}
            >
              <View style={[styles.infoIconBox, { backgroundColor: '#FF6B3515' }]}>
                <Ionicons name={row.icon as any} size={18} color={row.color || '#FF6B35'} />
              </View>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500', flex: 1 }}>
                {row.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.secondary} />
            </View>
          ))}
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* Hero */
  heroSection: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 36,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  blobTR: {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  blobBL: {
    position: 'absolute', bottom: -40, left: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(74,159,245,0.1)',
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarLetter: { color: '#fff', fontSize: 38, fontWeight: '800' },
  heroName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heroHandle: { fontSize: 14, marginTop: 4, marginBottom: 24 },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    gap: 12,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  statDivider: { width: 1, height: 40 },
  avatarSmall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Common */
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  card: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  /* Achievements */
  badgeRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  badgeCheckmark: {
    position: 'absolute', bottom: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  achieveDesc: { textAlign: 'center', fontSize: 13, lineHeight: 20 },
  /* Challenge */
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  challengeIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFF5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  /* Info Rows */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  infoIconBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  /* Sign Out */
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  signOutText: { color: '#FF3B30', fontWeight: '700', fontSize: 16 },
});
