import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../theme';
import { saveOnboarding } from '../utils/storage';

export default function OnboardingScreen({ onFinish }) {
  const handleStart = async () => {
    await saveOnboarding(true);
    onFinish();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.logo}>UniStreak</Text>
          <Text style={styles.tagline}>
            Estudia.{'\n'}Mantén tu racha.{'\n'}Supera tus límites.
          </Text>
        </View>

        <View style={styles.bottom}>
          <PrimaryButton title="Comenzar" onPress={handleStart} accessibilityLabel="Comenzar" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  top: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 24,
  },
  tagline: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  bottom: {
    width: '100%',
  },
});
