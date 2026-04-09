import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const payload = { 
        userName: username, 
        userEmail: email, 
        userPassword: password,
        userConfirmPassword: confirmPassword,
        userAddress: "System Operative",
        termsChecked: true,
        userRole: 'Citizen'
      };
      
      const csrfRes = await client.get('/user/csrf-token');
      const csrfTokenStr = csrfRes.data.csrfToken;

      const res = await client.post('/user/register', payload, {
          headers: { 'x-csrf-token': csrfTokenStr, 'Cookie': `csrfToken=${csrfTokenStr}` }
      });
      
      if (res.data.success || res.status === 201) {
        Alert.alert('Success', 'Access Granted. Please log in.');
        router.replace('/auth/login');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to register';
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[globalStyles.container, { backgroundColor: '#0A0A0A' }]}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' }}>
            System Access
          </Text>
        </View>

        <View style={[globalStyles.card, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', padding: 24 }]}>
          <Text style={{ color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 32 }}>
            Enter your credentials to synchronize with the Crisis Management Network.
          </Text>

          <Text style={styles.label}>OPERATIVE ALIAS</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#444"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
          />

          <Text style={styles.label}>ALIAS EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="email@crisis.com"
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>ENCRYPTION KEY</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, borderBottomWidth: 0, marginBottom: 0 }]}
              placeholderTextColor="#444"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Ionicons name="eye-outline" size={20} color="#444" />
          </View>

          <Text style={styles.label}>CONFIRM ENCRYPTION KEY</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, borderBottomWidth: 0, marginBottom: 0 }]}
              placeholderTextColor="#444"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <Ionicons name="eye-outline" size={20} color="#444" />
          </View>

          <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#8A2BE2', height: 60, marginTop: 40, flexDirection: 'row', justifyContent: 'center', gap: 10 }]} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={[globalStyles.buttonText, { textTransform: 'uppercase', letterSpacing: 2, fontWeight: '900' }]}>Create Account</Text>
                <Ionicons name="flash" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 20 }}>
          <Text style={{ color: '#444', fontSize: 12 }}>About</Text>
          <Text style={{ color: '#444', fontSize: 12 }}>Privacy</Text>
          <Text style={{ color: '#444', fontSize: 12 }}>Version 1.0</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: '#888' }}>Already an active operative? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={{ color: '#8A2BE2', fontWeight: '800' }}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#888',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingRight: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  }
});
