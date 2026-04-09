import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/complaint/my-contributions');
      if (res.data?.status === 'success') {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.log('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return theme.success;
      case 'In Progress': return theme.accent || theme.primary;
      case 'Rejected': return theme.danger;
      default: return '#fbbf24'; // Pending
    }
  };

  return (
    <ScrollView 
      style={[globalStyles.container, { backgroundColor: '#0A0A0A' }]}
      contentContainerStyle={[globalStyles.contentContainer, { paddingBottom: 100 }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} tintColor={theme.accent || theme.primary} />}
    >
      {/* Header Info - Matching Screenshot 1 */}
      <View style={{ marginBottom: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ color: theme.accent || '#D4FF00', fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>ACTIVE USER</Text>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 4, letterSpacing: 1 }}>
              {user?.userName?.toUpperCase() || 'OPERATIVE-X'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: theme.secondary, fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>HISTORY LOGS</Text>
            <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
              {[1, 2, 3].map(i => <View key={i} style={{ width: 6, height: 12, backgroundColor: theme.accent || '#D4FF00', borderRadius: 1 }} />)}
              <View style={{ width: 6, height: 12, backgroundColor: '#333', borderRadius: 1 }} />
            </View>
          </View>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ backgroundColor: 'rgba(212, 255, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212, 255, 0, 0.3)' }}>
          <Text style={{ color: theme.accent || '#D4FF00', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>NOTIFICATIONS</Text>
        </View>
        <Text style={{ color: theme.secondary, fontSize: 10, fontWeight: '700' }}>{complaints.length} EVENTS</Text>
      </View>

      {/* Activity Timeline Placeholder */}
      <View style={[globalStyles.card, { backgroundColor: '#121212', borderColor: '#1F1F1F', padding: 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ color: theme.accent || '#D4FF00', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>ACTIVITY TIMELINE</Text>
          <Text style={{ color: theme.secondary, fontSize: 8, fontWeight: '700' }}>LAST 12 HOURS</Text>
        </View>
        <View style={{ height: 60, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 }}>
           {/* Mock timeline */}
           <View style={{ width: 1, height: '100%', backgroundColor: '#222' }} />
           <View style={{ width: 1, height: '100%', backgroundColor: '#222' }} />
           <View style={{ width: 1, height: '100%', backgroundColor: '#222' }} />
           <View style={{ width: 4, height: 40, backgroundColor: theme.danger, borderRadius: 2, shadowColor: theme.danger, shadowOpacity: 0.5, shadowRadius: 5 }} />
           <View style={{ width: 1, height: '100%', backgroundColor: '#222' }} />
           <View style={{ width: 4, height: 50, backgroundColor: theme.accent, borderRadius: 2, shadowColor: theme.accent, shadowOpacity: 0.5, shadowRadius: 5 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ color: '#444', fontSize: 8 }}>12H</Text>
          <Text style={{ color: '#444', fontSize: 8 }}>6H</Text>
          <Text style={{ color: '#444', fontSize: 8 }}>2H</Text>
          <Text style={{ color: '#444', fontSize: 8 }}>1H</Text>
          <Text style={{ color: theme.accent, fontSize: 8, fontWeight: '800' }}>NOW</Text>
        </View>
      </View>

      {/* Recent Alerts Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 24 }}>
        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 }}>RECENT ALERTS</Text>
        <Text style={{ color: theme.secondary, fontSize: 10, fontWeight: '700' }}>{complaints.length} TOTAL</Text>
      </View>
      
      {complaints.length === 0 ? (
        <View style={[globalStyles.card, { alignItems: 'center', padding: 32, backgroundColor: '#121212', borderColor: '#1F1F1F' }]}>
          <Ionicons name="shield-checkmark-outline" size={48} color={theme.accent} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Text style={{ color: theme.secondary, textAlign: 'center', lineHeight: 20 }}>
            Sector Secure. No active incidents reported in your vicinity.
          </Text>
        </View>
      ) : (
        complaints.map((c: any) => (
          <TouchableOpacity key={c._id} style={[globalStyles.card, { backgroundColor: '#121212', borderColor: '#1F1F1F', flexDirection: 'row', gap: 16, alignItems: 'center' }]}>
            <View style={{ 
              width: 60, 
              height: 60, 
              borderRadius: 16, 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              justifyContent: 'center', 
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)'
            }}>
               <Ionicons 
                name={c.complaintType === 'Fire' ? "flame" : (c.complaintType === 'Flood' ? "water" : "warning")} 
                size={30} 
                color={getStatusColor(c.complaintStatus)} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>INCIDENT TYPE</Text>
              <Text style={{ color: getStatusColor(c.complaintStatus), fontWeight: '900', fontSize: 18, marginBottom: 4 }}>
                {c.complaintType?.toUpperCase() || 'UNKNOWN'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '800' }}>AI CONFIDENCE</Text>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>94.8%</Text>
                </View>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '800' }}>TIME</Text>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
