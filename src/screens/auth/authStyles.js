import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../theme';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontFamily: FONTS.extrabold,
    color: COLORS.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 21,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 8,
    marginBottom: 4,
  },
  success: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
});
