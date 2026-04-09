import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';

export default function ReportIssueScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [priority, setPriority] = useState('Medium');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [captioning, setCaptioning] = useState(false);
  const [aiScore, setAiScore] = useState(0);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  const categories = ['Pothole', 'Streetlight', 'Water Leak', 'Garbage', 'Drainage', 'Other'];
  const priorities = ['Low', 'Medium', 'High', 'Emergency'];

  // AI Prediction for Text
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (description.length > 10 && !captioning) {
        handlePredict();
      }
    }, 1500);
    return () => clearTimeout(delayDebounceFn);
  }, [description]);

  const handlePredict = async () => {
    try {
      setPredicting(true);
      const res = await client.post('/complaint/predict', { text: description });
      if (res.data) {
        if (res.data.category) setCategory(res.data.category);
        if (res.data.priority) setPriority(res.data.priority);
        if (res.data.confidence) setAiScore(res.data.confidence * 100);
      }
    } catch (err) {
      console.log('AI Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", `You need to allow ${useCamera ? 'camera' : 'gallery'} access to upload evidence.`);
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
      formData.append('image', {
        uri,
        name: 'upload.jpg',
        type: 'image/jpeg',
      });

      // Call AI Captioning & Fake Detection
      const res = await client.post('/complaint/caption', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.caption) {
        Alert.alert("AI Image Analysis", `AI detected: ${res.data.caption}. Would you like to use this as the description?`, [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: () => setDescription(res.data.caption) }
        ]);
        if (res.data.category) setCategory(res.data.category);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "AI Analysis failed";
      Alert.alert("AI Warning", errorMsg);
      if (errorMsg.includes("fake") || errorMsg.includes("AI-generated")) {
        setImage(null);
      }
    } finally {
      setCaptioning(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !image) {
      Alert.alert('Error', 'Please provide a title, description, and image evidence.');
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
      formData.append('image', {
        uri: image,
        name: 'complaint.jpg',
        type: 'image/jpeg',
      });

      await client.post('/complaint/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      Alert.alert('Success', 'Issue reported successfully! AI verified the evidence.', [
        { text: 'OK', onPress: () => router.push('/(citizen)') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={globalStyles.contentContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={globalStyles.title}>Report an Issue</Text>
      </View>

      <View style={globalStyles.card}>
        <Text style={styles.label}>Evidence (Image Required)</Text>
        {image ? (
          <View style={{ marginBottom: 16 }}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <TouchableOpacity 
              style={styles.removeImage} 
              onPress={() => setImage(null)}
            >
              <Ionicons name="close-circle" size={24} color={theme.error} />
            </TouchableOpacity>
            {captioning && (
              <View style={styles.aiOverlay}>
                <ActivityIndicator color="#fff" />
                <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '600' }}>AI Analyzing...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity style={styles.mediaButton} onPress={() => pickImage(true)}>
              <Ionicons name="camera" size={32} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: '600', marginTop: 4 }}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={() => pickImage(false)}>
              <Ionicons name="images" size={32} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: '600', marginTop: 4 }}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Issue Title</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="e.g. Broken Water Pipe"
          placeholderTextColor={theme.secondary}
          value={title}
          onChangeText={setTitle}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.label}>Description</Text>
          {predicting && <ActivityIndicator size="small" color={theme.primary} />}
        </View>
        <TextInput
          style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Describe the problem..."
          placeholderTextColor={theme.secondary}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {aiScore > 0 && (
          <View style={{ backgroundColor: theme.primary + '10', padding: 10, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700', marginLeft: 6 }}>
              AI Confidence: {Math.round(aiScore)}% | Verified: Yes
            </Text>
          </View>
        )}

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {categories.map(c => (
            <TouchableOpacity 
              key={c} 
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            >
              <Text style={[styles.chipText, category === c && { color: '#fff' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Priority</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {priorities.map(p => (
            <TouchableOpacity 
              key={p} 
              onPress={() => setPriority(p)}
              style={[styles.chip, priority === p && { backgroundColor: p === 'Emergency' ? theme.error : theme.primary, borderColor: p === 'Emergency' ? theme.error : theme.primary }]}
            >
              <Text style={[styles.chipText, priority === p && { color: '#fff' }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={globalStyles.button} onPress={handleSubmit} disabled={loading || captioning}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={globalStyles.buttonText}>Submit Report</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { color: '#666', marginBottom: 8, fontWeight: '600', fontSize: 14 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: '500', color: '#666' },
  mediaButton: { 
    flex: 1, 
    height: 100, 
    borderWidth: 2, 
    borderColor: '#eee', 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fafafa'
  },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  removeImage: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 12 },
  aiOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12
  }
});
