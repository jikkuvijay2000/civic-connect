import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  Alert, ActivityIndicator, Image, Modal, TextInput, StyleSheet,
} from 'react-native';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const PRIORITY_COLORS: Record<string, string> = {
  Emergency: '#FF3B30',
  High: '#FF9500',
  Medium: '#4A9FF5',
  Low: '#34C759',
};

const STATUS_COLORS: Record<string, string> = {
  Resolved: '#34C759',
  'In Progress': '#4A9FF5',
  Rejected: '#FF3B30',
  Pending: '#FF9500',
};

export default function AuthorityComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [updateNotes, setUpdateNotes] = useState('');

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/complaint/authority-complaints');
      if (res.data?.status === 'success') setComplaints(res.data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id);
      await client.put(`/complaint/update-status/${id}`, { status, notes: updateNotes });
      Alert.alert('✅ Updated', `Incident marked as ${status}`);
      setModalVisible(false);
      setUpdateNotes('');
      fetchComplaints();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally { setUpdating(null); }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchComplaints} tintColor="#4A9FF5" />}
      >
        {complaints.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="checkmark-done-circle" size={64} color="#34C759" style={{ opacity: 0.4, marginBottom: 16 }} />
            <Text style={{ color: theme.secondary, textAlign: 'center', fontSize: 15, lineHeight: 24 }}>
              No active incidents.{'\n'}Your department is all clear! 🎉
            </Text>
          </View>
        ) : (
          complaints.map((c) => {
            const pColor = PRIORITY_COLORS[c.complaintPriority] || '#4A9FF5';
            const sColor = STATUS_COLORS[c.complaintStatus] || STATUS_COLORS.Pending;
            const title =
              c.complaintDescription?.split('\n')[0]?.replace(/\*\*/g, '') || 'Untitled';

            return (
              <TouchableOpacity
                key={c._id}
                style={[styles.card, { backgroundColor: theme.surface, borderLeftColor: pColor }]}
                onPress={() => {
                  setSelectedComplaint(c);
                  setModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                {/* Top Row */}
                <View style={styles.cardTop}>
                  <View style={[styles.priorityPill, { backgroundColor: pColor + '18' }]}>
                    <View style={[styles.pDot, { backgroundColor: pColor }]} />
                    <Text style={[styles.priorityText, { color: pColor }]}>
                      {c.complaintPriority?.toUpperCase() || 'MEDIUM'}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: sColor + '18' }]}>
                    <Text style={[styles.statusText, { color: sColor }]}>
                      {(c.complaintStatus || 'Pending').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
                  {title}
                </Text>

                {/* Image */}
                {c.complaintImage && (
                  <Image source={{ uri: c.complaintImage }} style={styles.cardImg} />
                )}

                {/* Description */}
                <Text numberOfLines={2} style={[styles.cardDesc, { color: theme.secondary }]}>
                  {c.complaintDescription?.split('\n').slice(1).join(' ')}
                </Text>

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.footerLeft}>
                    <View style={[styles.userAvatar, { backgroundColor: '#4A9FF520' }]}>
                      <Ionicons name="person" size={12} color="#4A9FF5" />
                    </View>
                    <Text style={[styles.userText, { color: theme.secondary }]}>
                      {c.complaintUser?.userName || 'Citizen'}
                    </Text>
                  </View>
                  <View style={styles.aiScore}>
                    <Ionicons name="flash" size={13} color="#AF52DE" />
                    <Text style={{ color: '#AF52DE', fontSize: 12, fontWeight: '700' }}>
                      {Math.round(c.complaintAIScore || 0)}% AI
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Update Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Update Incident</Text>
              <TouchableOpacity
                onPress={() => { setModalVisible(false); setUpdateNotes(''); }}
                style={[styles.closeBtn, { backgroundColor: theme.background }]}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <View style={[styles.selectedInfo, { backgroundColor: theme.background }]}>
                <View style={[styles.pDot, { backgroundColor: PRIORITY_COLORS[selectedComplaint.complaintPriority] || '#4A9FF5', width: 10, height: 10 }]} />
                <Text style={[styles.selectedTitle, { color: theme.text }]} numberOfLines={2}>
                  {selectedComplaint.complaintDescription?.split('\n')[0]?.replace(/\*\*/g, '') || 'Incident'}
                </Text>
              </View>
            )}

            <Text style={[styles.notesLabel, { color: theme.secondary }]}>Add resolution notes (optional)</Text>
            <View style={[styles.notesInput, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TextInput
                style={{ color: theme.text, fontSize: 14, minHeight: 80, textAlignVertical: 'top' }}
                placeholder="e.g. Repair crew dispatched, estimated fix by tomorrow…"
                placeholderTextColor={theme.secondary}
                value={updateNotes}
                onChangeText={setUpdateNotes}
                multiline
              />
            </View>

            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#4A9FF5' }]}
                onPress={() => updateStatus(selectedComplaint?._id, 'In Progress')}
                disabled={!!updating}
              >
                {updating === selectedComplaint?._id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="time" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>In Progress</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#34C759' }]}
                onPress={() => updateStatus(selectedComplaint?._id, 'Resolved')}
                disabled={!!updating}
              >
                <Ionicons name="checkmark-done" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Resolved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
                onPress={() => updateStatus(selectedComplaint?._id, 'Rejected')}
                disabled={!!updating}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  /* Empty */
  emptyCard: {
    margin: 20, padding: 48, borderRadius: 24, alignItems: 'center',
  },
  /* Card */
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priorityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  pDot: { width: 7, height: 7, borderRadius: 4 },
  priorityText: { fontSize: 11, fontWeight: '800' },
  statusPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, lineHeight: 22 },
  cardImg: { width: '100%', height: 140, borderRadius: 12, marginBottom: 10 },
  cardDesc: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, paddingTop: 12,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  userText: { fontSize: 12, fontWeight: '500' },
  aiScore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  /* Modal */
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  selectedInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, marginBottom: 16,
  },
  selectedTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  notesLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  notesInput: {
    borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 20,
  },
  actionBtns: { gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, padding: 16,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
