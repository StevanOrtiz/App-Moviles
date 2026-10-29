import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { COLORS } from '../theme';
import AnimatedNumber from './AnimatedNumber';
import PressableScale from './PressableScale';
import { NATIVE, SPRING_SOFT } from '../utils/animation';

// Círculo del día: los días cumplidos aparecen con un "pop" escalonado
function DayDot({ completed, index, focused }) {
  const scale = useRef(new Animated.Value(completed ? 0 : 1)).current;
  useEffect(() => {
    if (!completed || !focused) return;
    scale.setValue(0.3);
    Animated.sequence([
      Animated.delay(120 + index * 60),
      Animated.spring(scale, { toValue: 1, ...SPRING_SOFT }),
    ]).start();
  }, [completed, focused, index, scale]);

  return (
    <Animated.View style={[styles.dayDot, completed && styles.dayDotDone, { transform: [{ scale }] }]}>
      {completed && <Text style={styles.dayCheck}>✓</Text>}
    </Animated.View>
  );
}

export default function StreakCard({ streak, week, premium, shieldUsed, onShieldPress }) {
  const focused = useIsFocused();
  const flicker = useRef(new Animated.Value(0)).current;

  // La llama "respira" mientras hay racha
  useEffect(() => {
    if (streak === 0) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(flicker, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [streak, flicker]);

  const flameStyle = {
    transform: [
      { scale: flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
      { rotate: flicker.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) },
    ],
  };

  return (
    <View style={[styles.card, premium && styles.premiumCard]}>
      <View style={styles.topRow}>
        <Animated.Text style={[styles.flame, flameStyle]}>🔥</Animated.Text>
        <View style={styles.flex}>
          <AnimatedNumber
            value={streak}
            format={(n) => `${n} ${n === 1 ? 'día' : 'días'}`}
            style={styles.streakValue}
          />
          <Text style={styles.streakLabel}>Racha actual</Text>
        </View>
        <PressableScale
          onPress={onShieldPress}
          disabled={!onShieldPress}
          haptic={onShieldPress ? 'tap' : null}
          style={[styles.shield, !premium && styles.shieldLocked]}
          accessibilityLabel="Escudo de racha"
        >
          <Text style={styles.shieldText}>
            {premium ? (shieldUsed ? '🛡️ Usado' : '🛡️ Listo') : '🛡️ 🔒'}
          </Text>
        </PressableScale>
      </View>

      <View style={styles.weekRow}>
        {week.map((day, index) => (
          <View key={day.label} style={styles.dayColumn}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <DayDot completed={day.completed} index={index} focused={focused} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  shield: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  shieldLocked: {
    opacity: 0.7,
  },
  shieldText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldSoft,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  flame: {
    fontSize: 36,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streakLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotDone: {
    backgroundColor: COLORS.secondaryGreen,
  },
  dayCheck: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
