import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Using active Localtunnel to securely bypass Windows Firewall
export const API_URL = 'https://nasty-days-melt.loca.lt';

const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use(async (config) => {
  // Required to bypass Localtunnel's warning page
  config.headers['Bypass-Tunnel-Reminder'] = 'true';

  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
