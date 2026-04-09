import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      // Attempt login directly since we disabled CSRF on backend
      const res = await client.post('/user/login', 
        { userEmail: email, userPassword: password }
      );
      
      if (res.status === 200) {
        const { accessToken, user } = res.data;
        await login(accessToken || '', user);
      }
    } catch (err: any) {
      console.error('Login Error details:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to login';
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[globalStyles.container, { backgroundColor: '#0A0A0A' }]}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' }}>
            System Sync
          </Text>
          <Text style={{ color: theme.accent || '#D4FF00', fontSize: 10, fontWeight: '800', marginTop: 8, letterSpacing: 2 }}>OPERATIVE AUTHENTICATION</Text>
        </View>

        <View style={[globalStyles.card, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', padding: 24 }]}>
          <Text style={styles.label}>OPERATIVE EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="email@crisis.com"
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>ACCESS KEY</Text>
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

          <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#8A2BE2', height: 60, marginTop: 40, flexDirection: 'row', justifyContent: 'center', gap: 10 }]} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={[globalStyles.buttonText, { textTransform: 'uppercase', letterSpacing: 2, fontWeight: '900' }]}>Initialize Sync</Text>
                <Ionicons name="sync" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
          <Text style={{ color: '#888' }}>New Operative? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={{ color: '#8A2BE2', fontWeight: '800' }}>Request Access</Text>
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
