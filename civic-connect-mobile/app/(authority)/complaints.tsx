import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, TextInput, StyleSheet } from 'react-native';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';

export default function AuthorityComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [updateNotes, setUpdateNotes] = useState('');
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/complaint/authority-complaints');
      if (res.data?.status === 'success') {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.log('Failed to fetch authority complaints');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id);
      await client.put(`/complaint/update-status/${id}`, { 
        status, 
        notes: updateNotes 
      });
      
      Alert.alert('Success', `Status updated to ${status}`);
      setModalVisible(false);
      setUpdateNotes('');
      fetchComplaints();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'Emergency': return theme.error;
      case 'High': return '#f97316';
      case 'Low': return theme.success;
      default: return theme.primary;
    }
  };

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'Resolved': return theme.success;
      case 'In Progress': return theme.primary;
      case 'Rejected': return theme.error;
      default: return '#fbbf24';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={globalStyles.container}
        contentContainerStyle={globalStyles.contentContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchComplaints} tintColor={theme.primary} />}
      >
        <Text style={[globalStyles.title, { marginBottom: 20 }]}>Incident Management</Text>

        {complaints.length === 0 ? (
          <View style={[globalStyles.card, { alignItems: 'center', padding: 40 }]}>
            <Ionicons name="checkmark-done-circle" size={64} color={theme.success} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Text style={{ color: theme.secondary, textAlign: 'center' }}>No active incidents in your department. Good job!</Text>
          </View>
        ) : (
          complaints.map((c: any) => (
            <TouchableOpacity 
              key={c._id} 
              style={globalStyles.card}
              onPress={() => {
                setSelectedComplaint(c);
                setModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="alert-circle" size={16} color={getPriorityColor(c.complaintPriority)} />
                    <Text style={{ color: getPriorityColor(c.complaintPriority), fontWeight: '800', fontSize: 11 }}>
                      {c.complaintPriority?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
                    {c.complaintDescription?.split('\n')[0].replace(/\*\*/g, '') || 'Untitled'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(c.complaintStatus) + '20' }]}>
                  <Text style={{ color: getStatusColor(c.complaintStatus), fontSize: 10, fontWeight: '800' }}>
                    {(c.complaintStatus || 'Pending').toUpperCase()}
                  </Text>
                </View>
              </View>

              {c.complaintImage && (
                <Image source={{ uri: c.complaintImage }} style={styles.cardImage} />
              )}

              <Text numberOfLines={2} style={{ color: theme.secondary, marginBottom: 12, fontSize: 14 }}>
                {c.complaintDescription?.split('\n').slice(1).join(' ')}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
                <Text style={{ fontSize: 11, color: theme.secondary }}>By: {c.complaintUser?.userName || 'Citizen'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="flash" size={14} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
                    AI Score: {Math.round(c.complaintAIScore)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Update Status Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>Update Incident</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.secondary, marginBottom: 8, fontSize: 14 }}>Add internal notes or resolution details:</Text>
            <TextInput
              style={[globalStyles.input, { height: 100, textAlignVertical: 'top', backgroundColor: theme.background }]}
              placeholder="e.g. Repairs scheduled for tomorrow..."
              placeholderTextColor={theme.secondary}
              value={updateNotes}
              onChangeText={setUpdateNotes}
              multiline
            />

            <View style={{ gap: 12, marginTop: 12 }}>
              <TouchableOpacity 
                style={[globalStyles.button, { backgroundColor: theme.primary }]}
                onPress={() => updateStatus(selectedComplaint?.complaintId, 'In Progress')}
                disabled={!!updating}
              >
                {updating === selectedComplaint?.complaintId ? <ActivityIndicator color="#fff" /> : <Text style={globalStyles.buttonText}>Mark In Progress</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[globalStyles.button, { backgroundColor: theme.success }]}
                onPress={() => updateStatus(selectedComplaint?.complaintId, 'Resolved')}
                disabled={!!updating}
              >
                <Text style={globalStyles.buttonText}>Mark Resolved</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[globalStyles.button, { backgroundColor: theme.error, opacity: 0.8 }]}
                onPress={() => updateStatus(selectedComplaint?.complaintId, 'Rejected')}
                disabled={!!updating}
              >
                <Text style={globalStyles.buttonText}>Reject Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cardImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
});
