import { StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 21,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  success: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
