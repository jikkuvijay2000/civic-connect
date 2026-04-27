import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      const res = await client.post('/user/login', { userEmail: email, userPassword: password });
      if (res.status === 200) {
        const { accessToken, user } = res.data;
        await login(accessToken || '', user);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to login';
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      {/* Orange Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.logoRing}>
          <Ionicons name="shield-checkmark" size={34} color="#fff" />
        </View>
        <Text style={styles.heroAppName}>Civic Connect</Text>
        <Text style={styles.heroTagline}>Community Safety Network</Text>

        {/* Decorative blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.formArea, { backgroundColor: theme.background }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome Back 👋</Text>
        <Text style={[styles.welcomeSub, { color: theme.secondary }]}>Sign in to your account</Text>

        {/* Email Field */}
        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="mail-outline" size={20} color={theme.secondary} />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Email address"
            placeholderTextColor={theme.secondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Field */}
        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.secondary} />
          <TextInput
            style={[styles.textInput, { color: theme.text, flex: 1 }]}
            placeholder="Password"
            placeholderTextColor={theme.secondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={styles.signInBtn}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.signInBtnText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={{ color: theme.secondary, fontSize: 15 }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 15 }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    backgroundColor: '#FF6B35',
    paddingTop: 72,
    paddingBottom: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  blobTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroAppName: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroTagline: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    marginTop: 6,
  },
  formArea: {
    padding: 28,
    paddingTop: 36,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 15,
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  signInBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  signInBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
});
