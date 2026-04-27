import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function AuthorityTabLayout() {
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
          title: 'Dashboard',
          headerTitle: 'Authority Hub',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={focused ? '#fff' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Incidents',
          headerTitle: 'Incident Management',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'shield' : 'shield-outline'} size={22} color={focused ? '#fff' : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#4A9FF5',
  },
});
