import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import client from '../../api/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

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
        userAddress: 'System Operative',
        termsChecked: true,
        userRole: 'Citizen',
      };
      const res = await client.post('/user/register', payload);
      if (res.data.status === 'success' || res.status === 200 || res.status === 201) {
        Alert.alert('Access Granted', 'Account created successfully! Please log in.');
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
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      {/* Compact hero */}
      <View style={styles.heroBanner}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <View style={styles.logoRing}>
          <Ionicons name="person-add" size={30} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Create Account</Text>
        <Text style={styles.heroSub}>Join the community safety network</Text>
        <View style={styles.blobRight} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.formArea, { backgroundColor: theme.background }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="person-outline" size={20} color={theme.secondary} />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Full name"
            placeholderTextColor={theme.secondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
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

        {/* Password */}
        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.secondary} />
          <TextInput
            style={[styles.textInput, { color: theme.text, flex: 1 }]}
            placeholder="Password (min 8 chars, A-Z, 0-9, special)"
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

        {/* Confirm Password */}
        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.secondary} />
          <TextInput
            style={[styles.textInput, { color: theme.text, flex: 1 }]}
            placeholder="Confirm password"
            placeholderTextColor={theme.secondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {confirmPassword.length > 0 && (
            <Ionicons
              name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={password === confirmPassword ? '#34C759' : '#FF3B30'}
            />
          )}
        </View>

        {/* Password hint */}
        <View style={[styles.hintCard, { backgroundColor: '#FFF0E8' }]}>
          <Ionicons name="information-circle-outline" size={16} color="#FF6B35" />
          <Text style={{ color: '#FF6B35', fontSize: 12, flex: 1, lineHeight: 18 }}>
            Password must have 8+ chars with uppercase, lowercase, number & special character (@$!%*?&#)
          </Text>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.registerBtnText}>Create Account</Text>
              <Ionicons name="flash" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginRow}>
          <Text style={{ color: theme.secondary, fontSize: 15 }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 15 }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    backgroundColor: '#FF6B35',
    paddingTop: 64,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blobRight: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoRing: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 6,
  },
  formArea: {
    padding: 24,
    paddingTop: 32,
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
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  registerBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 20,
  },
});
