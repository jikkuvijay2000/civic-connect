import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';

export default function RewardsScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/reward/list');
      if (res.data) {
        setRewards(res.data);
      }
    } catch (err) {
      console.log('Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

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
              Alert.alert('Success', 'Reward claimed successfully! Check your email for details.');
              fetchRewards();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to claim reward');
            } finally {
              setClaiming(null);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={globalStyles.container}
      contentContainerStyle={globalStyles.contentContainer}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRewards} tintColor={theme.primary} />}
    >
      <View style={{ marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={globalStyles.title}>Civic Rewards</Text>
          <Text style={globalStyles.subtitle}>Redeem your hard-earned points</Text>
        </View>
        <View style={{ backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="star" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: '800' }}>{user?.rewardPoints || 0}</Text>
        </View>
      </View>

      {rewards.length === 0 ? (
        <View style={[globalStyles.card, { alignItems: 'center', padding: 40 }]}>
          <Ionicons name="gift-outline" size={64} color={theme.secondary} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text style={{ color: theme.secondary, textAlign: 'center' }}>No rewards available at the moment. Keep contributing!</Text>
        </View>
      ) : (
        rewards.map((r: any) => (
          <View key={r._id} style={globalStyles.card}>
            {r.rewardImage && (
              <Image source={{ uri: r.rewardImage }} style={styles.rewardImage} />
            )}
            <View style={{ padding: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18, flex: 1 }}>{r.rewardTitle}</Text>
                <View style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '800' }}>{r.rewardPointsCost} pts</Text>
                </View>
              </View>
              
              <Text style={{ color: theme.secondary, marginBottom: 16, fontSize: 14 }}>{r.rewardDescription}</Text>
              
              <TouchableOpacity 
                style={[globalStyles.button, { backgroundColor: (user?.rewardPoints || 0) >= r.rewardPointsCost ? theme.success : theme.secondary, opacity: (user?.rewardPoints || 0) >= r.rewardPointsCost ? 1 : 0.6 }]}
                onPress={() => handleClaim(r._id, r.rewardPointsCost)}
                disabled={!!claiming || (user?.rewardPoints || 0) < r.rewardPointsCost}
              >
                {claiming === r._id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={globalStyles.buttonText}>
                    {(user?.rewardPoints || 0) >= r.rewardPointsCost ? 'Claim Reward' : 'Not Enough Points'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rewardImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
});
