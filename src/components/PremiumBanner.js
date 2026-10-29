import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../theme';
import { NATIVE } from '../utils/animation';
import Pattern from './Pattern';

// Banner dorado con brillo que cruza la tarjeta y corona que late: invita a hacerse Premium
export default function PremiumBanner({ onPress }) {
  const shine = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE,
        }),
        Animated.delay(1400),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: NATIVE }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: NATIVE }),
      ]),
    );
    shineLoop.start();
    pulseLoop.start();
    return () => {
      shineLoop.stop();
      pulseLoop.stop();
    };
  }, [shine, pulse]);

  const translateX = shine.interpolate({ inputRange: [0, 1], outputRange: [-160, 460] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const rotate = pulse.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Pressable onPress={onPress} accessibilityLabel="Hazte Premium">
      <View style={styles.card}>
        <Pattern variant="dots" color={COLORS.yellow} opacity={0.12} />
        <Animated.Text style={[styles.crown, { transform: [{ scale }, { rotate }] }]}>
          👑
        </Animated.Text>
        <View style={styles.texts}>
          <Text style={styles.title}>UniStreak Premium</Text>
          <Text style={styles.subtitle}>Estadísticas pro · Pomodoro a tu medida · Escudo de racha</Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Probar</Text>
        </View>
        <Animated.View pointerEvents="none" style={[styles.shine, { transform: [{ translateX }, { rotate: '20deg' }] }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.gold,
    overflow: 'hidden',
    shadowColor: COLORS.gold,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  crown: { fontFamily: FONTS.regular, fontSize: 34 },
  texts: { flex: 1 },
  title: { color: COLORS.yellow, fontSize: 17, fontFamily: FONTS.extrabold },
  subtitle: { color: COLORS.white, fontFamily: FONTS.regular, fontSize: 12, marginTop: 2, opacity: 0.9 },
  cta: {
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  ctaText: { color: COLORS.primary, fontFamily: FONTS.extrabold, fontSize: 14 },
  shine: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    width: 50,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
