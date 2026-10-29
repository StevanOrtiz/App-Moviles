import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONTS } from '../theme';
import Paper from '../components/Paper';
import Blob from '../components/Blob';
import FadeInView from '../components/FadeInView';
import { saveOnboarding } from '../utils/storage';

export default function OnboardingScreen({ onFinish }) {
  const handleStart = async () => {
    await saveOnboarding(true);
    onFinish();
  };

  return (
    <Paper>
    <Blob size={360} color={COLORS.secondaryGreen} opacity={0.22} style={styles.blobTop} />
    <Blob size={260} color={COLORS.yellow} opacity={0.3} shape={1} style={styles.blobBottom} />
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.top}>
          <FadeInView replayOnFocus={false}>
            <Text style={styles.logo}>UniStreak 🔥</Text>
          </FadeInView>
          {['Estudia.', 'Mantén tu racha.', 'Supera tus límites.'].map((line, i) => (
            <FadeInView key={line} delay={200 + i * 180} distance={18} replayOnFocus={false}>
              <Text style={styles.tagline}>{line}</Text>
            </FadeInView>
          ))}
        </View>

        <FadeInView delay={800} replayOnFocus={false} style={styles.bottom}>
          <PrimaryButton title="Comenzar" onPress={handleStart} accessibilityLabel="Comenzar" />
        </FadeInView>
      </View>
    </SafeAreaView>
    </Paper>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: 24,
  },
  tagline: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  blobTop: {
    top: -120,
    right: -140,
  },
  blobBottom: {
    bottom: 80,
    left: -110,
  },
  bottom: {
    width: '100%',
  },
});
