import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/complaint/authority-stats');
      if (res.data?.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.log('Failed to fetch authority stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[globalStyles.card, { flex: 1, alignItems: 'center', minWidth: '45%' }]}>
      <Ionicons name={icon} size={24} color={color} style={{ marginBottom: 8 }} />
      <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text }}>{value}</Text>
      <Text style={{ color: theme.secondary, fontSize: 12, fontWeight: '500', marginTop: 4 }}>{title}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={globalStyles.container}
      contentContainerStyle={globalStyles.contentContainer}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} tintColor={theme.primary} />}
    >
      <View style={{ marginBottom: 24 }}>
        <Text style={globalStyles.title}>Authority Hub</Text>
        <Text style={globalStyles.subtitle}>{user?.userDepartment || 'General'} Department Overview</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <StatCard title="Total Reports" value={stats?.total || 0} icon="list" color={theme.primary} />
        <StatCard title="Pending" value={stats?.pending || 0} icon="time" color="#fbbf24" />
        <StatCard title="Resolved" value={stats?.resolved || 0} icon="checkmark-done" color={theme.success} />
        <StatCard title="AI Confidence" value={`${stats?.avgConfidence || 0}%`} icon="flash" color={theme.primary} />
      </View>

      <Text style={[globalStyles.title, { fontSize: 18, marginBottom: 16 }]}>AI Distribution</Text>
      <View style={globalStyles.card}>
        {stats?.confidenceDistribution?.map((item: any, index: number) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: theme.secondary, fontSize: 13 }}>{item.value} Reports</Text>
            </View>
            <View style={{ height: 8, backgroundColor: theme.background, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: item.name.includes('High') ? theme.success : (item.name.includes('Low') ? theme.error : theme.primary),
                width: `${(item.value / (stats.total || 1)) * 100}%` 
              }} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 24, padding: 20, backgroundColor: theme.primary + '10', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: theme.primary }}>
        <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 16, marginBottom: 4 }}>AI Insight</Text>
        <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>
          {stats?.pending > 5 
            ? `Your department has ${stats.pending} pending issues. We recommend prioritizing the High/Emergency cases first.`
            : "Great job! Your department's resolution rate is looking healthy."}
        </Text>
      </View>
    </ScrollView>
  );
}
