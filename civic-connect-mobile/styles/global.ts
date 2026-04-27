import { StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export const getGlobalStyles = (theme: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.secondary,
    marginBottom: 24,
  },
  input: {
    backgroundColor: theme.surface,
    color: theme.text,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkText: {
    color: theme.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
});
