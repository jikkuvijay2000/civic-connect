import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  Image, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function RewardsScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/reward/list');
      // Handle both array response and wrapped {status, data:[]} shape
      const data = res.data;
      if (Array.isArray(data)) {
        setRewards(data);
      } else if (Array.isArray(data?.data)) {
        setRewards(data.data);
      } else {
        setRewards([]);
      }
    } catch {
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  const handleClaim = async (rewardId: string, cost: number) => {
    if ((user?.rewardPoints || 0) < cost) {
      Alert.alert('Insufficient Points', `You need ${cost} points to claim this reward.`);
      return;
    }
    Alert.alert(
      'Claim Reward',
      `Use ${cost} points to claim this reward?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              setClaiming(rewardId);
              await client.post(`/reward/claim/${rewardId}`);
              Alert.alert('🎉 Success', 'Reward claimed! Check your email for details.');
              fetchRewards();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to claim reward');
            } finally {
              setClaiming(null);
            }
          },
        },
      ],
    );
  };

  const points = user?.rewardPoints || 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRewards} tintColor="#FF6B35" />}
    >
      {/* Points Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.blobBR} />
        <View style={styles.blobTL} />
        <Text style={styles.balanceLabel}>YOUR CIVIC POINTS</Text>
        <Text style={styles.balanceNumber}>{points}</Text>
        <Text style={styles.balanceSub}>Earned by reporting civic issues</Text>
        <View style={styles.balanceBadge}>
          <Ionicons name="star" size={14} color="#FF6B35" />
          <Text style={styles.balanceBadgeText}>Civic Contributor</Text>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Rewards</Text>
        <View style={[styles.countPill, { backgroundColor: '#FF6B3520' }]}>
          <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 12 }}>{rewards.length} items</Text>
        </View>
      </View>

      {rewards.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="gift-outline" size={60} color="#FF6B35" style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: theme.secondary }]}>
            No rewards available yet.{'\n'}Keep contributing to earn points!
          </Text>
        </View>
      ) : (
        rewards.map((r) => {
          const canClaim = points >= r.rewardPointsCost;
          return (
            <View key={r._id} style={[styles.rewardCard, { backgroundColor: theme.surface }]}>
              {r.rewardImage && (
                <Image source={{ uri: r.rewardImage }} style={styles.rewardImage} />
              )}
              <View style={styles.rewardBody}>
                <View style={styles.rewardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rewardTitle, { color: theme.text }]}>{r.rewardTitle}</Text>
                    <Text style={[styles.rewardDesc, { color: theme.secondary }]}>{r.rewardDescription}</Text>
                  </View>
                  <View style={[styles.costBadge, { backgroundColor: canClaim ? '#FF6B3520' : '#8E8E9320' }]}>
                    <Ionicons name="star" size={12} color={canClaim ? '#FF6B35' : '#8E8E93'} />
                    <Text style={[styles.costText, { color: canClaim ? '#FF6B35' : '#8E8E93' }]}>
                      {r.rewardPointsCost}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, (points / r.rewardPointsCost) * 100)}%`,
                        backgroundColor: canClaim ? '#34C759' : '#FF6B35',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressLabel, { color: theme.secondary }]}>
                  {canClaim
                    ? `✓ You have enough points!`
                    : `${points} / ${r.rewardPointsCost} points`}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.claimBtn,
                    { backgroundColor: canClaim ? '#34C759' : theme.border },
                  ]}
                  onPress={() => handleClaim(r._id, r.rewardPointsCost)}
                  disabled={!!claiming || !canClaim}
                >
                  {claiming === r._id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={canClaim ? 'gift' : 'lock-closed-outline'}
                        size={16}
                        color={canClaim ? '#fff' : theme.secondary}
                      />
                      <Text style={[styles.claimBtnText, { color: canClaim ? '#fff' : theme.secondary }]}>
                        {canClaim ? 'Claim Reward' : 'Not Enough Points'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  /* Balance card */
  balanceCard: {
    margin: 20,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    padding: 28,
    overflow: 'hidden',
    alignItems: 'center',
  },
  blobBR: {
    position: 'absolute', bottom: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  blobTL: {
    position: 'absolute', top: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  balanceNumber: { color: '#fff', fontSize: 60, fontWeight: '900', letterSpacing: -2, marginTop: 4 },
  balanceSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 16 },
  balanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  balanceBadgeText: { color: '#FF6B35', fontWeight: '700', fontSize: 13 },
  /* Section */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  countPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  /* Empty */
  emptyCard: {
    margin: 20, borderRadius: 24, padding: 48, alignItems: 'center',
  },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 24 },
  /* Reward Card */
  rewardCard: {
    marginHorizontal: 20, marginBottom: 16, borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  rewardImage: { width: '100%', height: 160 },
  rewardBody: { padding: 18 },
  rewardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  rewardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  rewardDesc: { fontSize: 13, lineHeight: 19 },
  costBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  costText: { fontWeight: '800', fontSize: 13 },
  progressTrack: {
    height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.07)', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 12, marginBottom: 14 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, padding: 14,
  },
  claimBtnText: { fontSize: 15, fontWeight: '700' },
});
