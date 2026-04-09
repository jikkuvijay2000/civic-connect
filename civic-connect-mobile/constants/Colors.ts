const tintColorLight = '#8A2BE2';
const tintColorDark = '#D4FF00'; // Neon Green from screenshots

export const Colors = {
  light: {
    text: '#1e293b',
    background: '#f8fafc',
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    surface: '#ffffff',
    border: '#e2e8f0',
    primary: '#8A2BE2',
    accent: '#D4FF00', // added missing property
    secondary: '#64748b',
    success: '#10b981',
    danger: '#ef4444',
    error: '#ef4444', // added missing property
  },
  dark: {
    text: '#f8fafc',
    background: '#0A0A0A', // Deep black
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#334155',
    tabIconSelected: tintColorDark,
    surface: '#121212', // Slightly lighter black for cards
    border: '#1F1F1F',
    primary: '#8A2BE2', // Purple from the scan button
    accent: '#D4FF00', // Neon Green
    secondary: '#94a3b8',
    success: '#10b981',
    danger: '#FF3B30',
    error: '#FF3B30', // added missing property
  },
};
