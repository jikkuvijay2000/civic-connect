import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function CitizenTabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { logout } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4A9FF5',
        tabBarInactiveTintColor: '#C7C7CC',
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.text,
          letterSpacing: -0.3,
        },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 20, padding: 4 }}>
            <Ionicons name="log-out-outline" size={22} color={theme.secondary} />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 0,
          height: 72,
          position: 'absolute',
          bottom: 16,
          left: 20,
          right: 20,
          borderRadius: 40,
          paddingBottom: 0,
          paddingTop: 0,
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 24,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'globe' : 'globe-outline'} size={22} color={focused ? '#fff' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          headerTitle: 'Nearby Incidents',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'location' : 'location-outline'} size={22} color={focused ? '#fff' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          headerTitle: 'Report Incident',
          tabBarIcon: () => (
            <View style={styles.reportBtn}>
              <Ionicons name="add" size={30} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          headerTitle: 'Civic Rewards',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'ribbon' : 'ribbon-outline'} size={22} color={focused ? '#fff' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={focused ? '#fff' : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#4A9FF5',
  },
  reportBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
