import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  'Sanitation Department', 'Traffic Department', 'Public Works Department',
  'Water Department', 'Electricity Department', 'Fire Department',
  'Health Department', 'General Administration'
];
const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#34C759',
  Medium: '#4A9FF5',
  High: '#FF9500',
  Emergency: '#FF3B30',
};

export default function ReportIssueScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General Administration');
  const [priority, setPriority] = useState('Medium');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [captioning, setCaptioning] = useState(false);
  const [aiScore, setAiScore] = useState(0);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Auto-predict from description
  useEffect(() => {
    const t = setTimeout(() => {
      if (description.length > 10 && !captioning) handlePredict();
    }, 1500);
    return () => clearTimeout(t);
  }, [description]);

  const handlePredict = async () => {
    try {
      setPredicting(true);
      const res = await client.post('/complaint/predict', { text: description });
      if (res.data?.category) setCategory(res.data.category);
      if (res.data?.priority) setPriority(res.data.priority);
      if (res.data?.confidence) setAiScore(res.data.confidence * 100);
    } catch { /* silent */ } finally { setPredicting(false); }
  };

  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permission Required', `Allow ${useCamera ? 'camera' : 'gallery'} access to upload evidence.`);
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      handleImageAI(uri);
    }
  };

  const handleImageAI = async (uri: string) => {
    try {
      setCaptioning(true);
      const formData = new FormData();
      // @ts-ignore
      formData.append('image', { uri, name: 'upload.jpg', type: 'image/jpeg' });
      const res = await client.post('/complaint/caption', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.caption) {
        Alert.alert(
          '🤖 AI Image Analysis',
          `Detected: ${res.data.caption}\n\nUse this as description?`,
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => setDescription(res.data.caption) },
          ],
        );
        if (res.data.category) setCategory(res.data.category);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'AI analysis failed';
      Alert.alert('AI Warning', msg);
      if (msg.includes('fake') || msg.includes('AI-generated')) setImage(null);
    } finally { setCaptioning(false); }
  };

  const handleSubmit = async () => {
    if (!title || !description || !image) {
      Alert.alert('Missing Info', 'Please provide a title, description, and photo evidence.');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('location', 'Current Location');
      formData.append('lat', '12.9716');
      formData.append('lng', '77.5946');
      formData.append('aiScore', aiScore.toString());
      // @ts-ignore
      formData.append('image', { uri: image, name: 'complaint.jpg', type: 'image/jpeg' });

      await client.post('/complaint/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('✅ Submitted!', 'Your incident has been reported successfully.', [
        { text: 'OK', onPress: () => router.push('/(citizen)') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit report');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Image Upload Area */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          📸 Photo Evidence
          <Text style={{ color: '#FF3B30' }}> *</Text>
        </Text>
        <Text style={[styles.sectionSub, { color: theme.secondary }]}>
          A clear photo helps AI verify and categorize the issue
        </Text>

        {image ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: image }} style={styles.previewImg} />
            <TouchableOpacity style={styles.removeImg} onPress={() => setImage(null)}>
              <Ionicons name="close-circle" size={28} color="#FF3B30" />
            </TouchableOpacity>
            {captioning && (
              <View style={styles.aiOverlay}>
                <ActivityIndicator color="#fff" />
                <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '600' }}>AI Scanning…</Text>
              </View>
            )}
            {!captioning && aiScore > 0 && (
              <View style={styles.aiScoreBadge}>
                <Ionicons name="flash" size={12} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                  AI {Math.round(aiScore)}% confident
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={[styles.uploadBtn, { borderColor: '#FF6B35' }]}
              onPress={() => pickImage(true)}
            >
              <View style={[styles.uploadIcon, { backgroundColor: '#FFF0E8' }]}>
                <Ionicons name="camera" size={26} color="#FF6B35" />
              </View>
              <Text style={[styles.uploadLabel, { color: theme.text }]}>Camera</Text>
              <Text style={[styles.uploadSub, { color: theme.secondary }]}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadBtn, { borderColor: '#4A9FF5' }]}
              onPress={() => pickImage(false)}
            >
              <View style={[styles.uploadIcon, { backgroundColor: '#EEF5FF' }]}>
                <Ionicons name="images" size={26} color="#4A9FF5" />
              </View>
              <Text style={[styles.uploadLabel, { color: theme.text }]}>Gallery</Text>
              <Text style={[styles.uploadSub, { color: theme.secondary }]}>Choose photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Form Card */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        {/* Title */}
        <Text style={[styles.label, { color: theme.secondary }]}>Issue Title</Text>
        <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Ionicons name="create-outline" size={18} color={theme.secondary} />
          <TextInput
            style={[styles.inputText, { color: theme.text }]}
            placeholder="e.g. Broken Water Pipe on MG Road"
            placeholderTextColor={theme.secondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.descHeader}>
          <Text style={[styles.label, { color: theme.secondary }]}>Description</Text>
          {predicting && (
            <View style={styles.aiBadge}>
              <ActivityIndicator size="small" color="#4A9FF5" />
              <Text style={{ color: '#4A9FF5', fontSize: 11, fontWeight: '600' }}>AI predicting…</Text>
            </View>
          )}
        </View>
        <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: theme.border, alignItems: 'flex-start', minHeight: 100 }]}>
          <Ionicons name="document-text-outline" size={18} color={theme.secondary} style={{ marginTop: 2 }} />
          <TextInput
            style={[styles.inputText, { color: theme.text, flex: 1 }]}
            placeholder="Describe the issue in detail…"
            placeholderTextColor={theme.secondary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* AI Confidence */}
        {aiScore > 0 && (
          <View style={styles.aiConfidence}>
            <Ionicons name="shield-checkmark" size={16} color="#34C759" />
            <Text style={{ color: '#34C759', fontSize: 13, fontWeight: '700' }}>
              AI Verified · {Math.round(aiScore)}% confidence
            </Text>
          </View>
        )}

        {/* Category */}
        <Text style={[styles.label, { color: theme.secondary, marginBottom: 10 }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[
                styles.chip,
                {
                  backgroundColor: category === c ? '#FF6B35' : theme.background,
                  borderColor: category === c ? '#FF6B35' : theme.border,
                },
              ]}
            >
              <Text style={{ color: category === c ? '#fff' : theme.secondary, fontWeight: '600', fontSize: 13 }}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Priority */}
        <Text style={[styles.label, { color: theme.secondary, marginBottom: 10 }]}>Priority Level</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => {
            const pColor = PRIORITY_COLORS[p];
            const isActive = priority === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.priorityBtn,
                  {
                    backgroundColor: isActive ? pColor + '20' : theme.background,
                    borderColor: isActive ? pColor : theme.border,
                  },
                ]}
              >
                <View style={[styles.priorityDot, { backgroundColor: pColor }]} />
                <Text style={{ color: isActive ? pColor : theme.secondary, fontWeight: '700', fontSize: 13 }}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, { opacity: loading || captioning ? 0.7 : 1 }]}
        onPress={handleSubmit}
        disabled={loading || captioning}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitText}>Submit Report</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    margin: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: 16 },
  /* Image upload */
  uploadRow: { flexDirection: 'row', gap: 12 },
  uploadBtn: {
    flex: 1, height: 120, borderWidth: 2, borderStyle: 'dashed',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  uploadIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  uploadLabel: { fontSize: 14, fontWeight: '700' },
  uploadSub: { fontSize: 12 },
  imagePreview: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  previewImg: { width: '100%', height: 200, borderRadius: 16 },
  removeImg: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 14 },
  aiOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', padding: 10,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
  },
  aiScoreBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#34C759', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  /* Form */
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, marginBottom: 8 },
  descHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 16,
  },
  inputText: { flex: 1, fontSize: 15 },
  aiConfidence: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#34C75918', borderRadius: 10, padding: 10, marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8,
  },
  priorityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  priorityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  /* Submit */
  submitBtn: {
    marginHorizontal: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
