import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.secondary }}>Civic Connect Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (user.userRole === 'Authority') {
    return <Redirect href="/(authority)" />;
  }

  return <Redirect href="/(citizen)" />;
}
