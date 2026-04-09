import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../../constants/Colors';
import { getGlobalStyles } from '../../styles/global';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const globalStyles = getGlobalStyles(theme);

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={globalStyles.contentContainer}>
      <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 20 }}>
        <View style={{ 
          width: 100, 
          height: 100, 
          borderRadius: 50, 
          backgroundColor: theme.surface, 
          justifyContent: 'center', 
          alignItems: 'center',
          borderWidth: 2,
          borderColor: theme.accent || theme.primary,
          marginBottom: 16,
          shadowColor: theme.accent || theme.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
        }}>
          <Ionicons name="person" size={50} color={theme.accent || theme.primary} />
        </View>
        <Text style={[globalStyles.title, { marginBottom: 4 }]}>{user?.userName || 'Operative'}</Text>
        <Text style={{ color: theme.secondary }}>{user?.userEmail}</Text>
      </View>

      <View style={globalStyles.card}>
        <Text style={[globalStyles.title, { fontSize: 18, marginBottom: 16 }]}>Account Details</Text>
        
        <View style={styles.infoRow}>
          <Text style={{ color: theme.secondary }}>Role</Text>
          <Text style={{ color: theme.text, fontWeight: '600' }}>{user?.userRole}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={{ color: theme.secondary }}>Civic Points</Text>
          <Text style={{ color: theme.accent || theme.primary, fontWeight: '800' }}>{user?.rewardPoints || 0}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[globalStyles.button, { backgroundColor: '#FF3B30', marginTop: 32 }]} 
        onPress={logout}
      >
        <Text style={globalStyles.buttonText}>Log Out System</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  }
});
