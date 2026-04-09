import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, TouchableOpacity, View } from 'react-native';
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
        tabBarActiveTintColor: theme.tint,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 16,
          textTransform: 'uppercase',
          letterSpacing: 2,
          color: theme.accent || theme.primary,
        },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <Ionicons name="log-out-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        ),
        headerTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          borderTopWidth: 0,
          height: 70,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 35,
          paddingBottom: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
        },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Command Center',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          headerTitle: 'Tactical Overlay',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "radio" : "radio-outline"} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          headerTitle: 'Incident Report',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              backgroundColor: '#8A2BE2', 
              width: 50, 
              height: 50, 
              borderRadius: 25, 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 10,
              borderWidth: 4,
              borderColor: '#0A0A0A',
              shadowColor: '#8A2BE2',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 10,
            }}>
              <Ionicons name="scan" size={24} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Predictive',
          headerTitle: 'Predictive Analysis',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />,
        }}
      />
       <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Operative Profile',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
