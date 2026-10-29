import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import ProgressRing from './ProgressRing';
import Pattern from './Pattern';
import { NATIVE } from '../utils/animation';
import { COLORS, FONTS } from '../theme';
import { formatClock } from '../utils/formatTime';
import { PHASE_LABELS, isBreak } from '../utils/pomodoro';
import { cancelPomodoroAlarm, schedulePomodoroAlarm } from '../services/notificationService';

// Temporizador con anillo de progreso. `phase` es focus | shortBreak | longBreak;
// `dots` muestra los enfoques hechos en la tanda. onComplete se llama al terminar cualquier fase.
export default function PomodoroTimer({
  timer,
  setTimer,
  isRunning,
  setIsRunning,
  onComplete,
  duration = 1500,
  phase = 'focus',
  dots = [],
  onSkip,
  onSettings,
}) {
  const timerRef = useRef(timer);
  timerRef.current = timer;
  const resting = isBreak(phase);

  // Alarma: avisa cuando termina la fase aunque la app esté en segundo plano
  useEffect(() => {
    if (!isRunning) return undefined;
    schedulePomodoroAlarm(timerRef.current, { isBreak: resting });
    return () => {
      cancelPomodoroAlarm();
    };
  }, [isRunning, resting]);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // El tiempo restante se calcula contra la hora de fin (no restando 1 por segundo):
  // así sigue correcto si la app pasó un rato en segundo plano.
  useEffect(() => {
    if (!isRunning) return undefined;

    const endAt = Date.now() + timerRef.current * 1000;
    let finished = false;
    const tick = () => {
      if (finished) return;
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (remaining > 0) {
        setTimer(remaining);
        return;
      }
      finished = true;
      setTimer(0);
      setIsRunning(false);
      onCompleteRef.current();
    };

    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Latido suave del reloj mientras corre
  const beat = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isRunning) {
      beat.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
        Animated.timing(beat, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isRunning, beat]);
  const clockScale = beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });

  const handleStart = () => {
    if (timer > 0) setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimer(duration);
  };

  const fresh = timer === duration;
  const progress = duration > 0 ? 1 - timer / duration : 0;
  const accent = resting ? COLORS.yellow : COLORS.secondaryGreen;

  return (
    <View style={styles.card}>
      <Pattern variant="topo" color={resting ? COLORS.yellow : COLORS.white} opacity={resting ? 0.1 : 0.07} />

      <View style={styles.topRow}>
        <View style={[styles.phasePill, resting && styles.phasePillRest]}>
          <Ionicons name={resting ? 'cafe' : 'flash'} size={13} color={resting ? COLORS.primary : COLORS.secondaryGreen} />
          <Text style={[styles.phaseText, resting && styles.phaseTextRest]}>{PHASE_LABELS[phase]}</Text>
        </View>
        {onSettings && (
          <Pressable onPress={onSettings} hitSlop={10} accessibilityLabel="Ajustes del Pomodoro" disabled={isRunning}>
            <Ionicons name="settings-outline" size={20} color={COLORS.white} style={isRunning && { opacity: 0.4 }} />
          </Pressable>
        )}
      </View>

      <ProgressRing size={220} stroke={10} progress={progress} color={accent} trackColor="rgba(255,255,255,0.12)">
        <Animated.Text style={[styles.clock, { transform: [{ scale: clockScale }] }]}>
          {formatClock(timer)}
        </Animated.Text>
        <View style={styles.dots}>
          {dots.map((done, i) => (
            <View key={i} style={[styles.dot, done && { backgroundColor: accent }]} />
          ))}
        </View>
      </ProgressRing>

      <View style={styles.controls}>
        {!isRunning ? (
          <PressableScale
            haptic="press"
            containerStyle={styles.mainWrap}
            style={[styles.controlButton, styles.mainButton, resting && { backgroundColor: COLORS.yellow }]}
            onPress={handleStart}
            accessibilityLabel={fresh ? 'Iniciar' : 'Reanudar'}
          >
            <Ionicons name="play" size={22} color={COLORS.primary} />
            <Text style={styles.mainButtonText}>
              {fresh ? (resting ? 'Iniciar descanso' : 'Iniciar') : 'Reanudar'}
            </Text>
          </PressableScale>
        ) : (
          <PressableScale
            haptic="press"
            containerStyle={styles.mainWrap}
            style={[styles.controlButton, styles.mainButton, resting && { backgroundColor: COLORS.yellow }]}
            onPress={handlePause}
            accessibilityLabel="Pausar"
          >
            <Ionicons name="pause" size={22} color={COLORS.primary} />
            <Text style={styles.mainButtonText}>Pausar</Text>
          </PressableScale>
        )}

        {resting && onSkip ? (
          <PressableScale
            haptic="tap"
            style={[styles.controlButton, styles.resetButton]}
            onPress={onSkip}
            accessibilityLabel="Saltar descanso"
          >
            <Ionicons name="play-skip-forward" size={20} color={COLORS.primary} />
          </PressableScale>
        ) : (
          <PressableScale
            haptic="tap"
            style={[styles.controlButton, styles.resetButton]}
            onPress={handleReset}
            accessibilityLabel="Reiniciar"
          >
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(101,216,137,0.15)',
  },
  phasePillRest: {
    backgroundColor: COLORS.yellow,
  },
  phaseText: {
    color: COLORS.secondaryGreen,
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  phaseTextRest: {
    color: COLORS.primary,
  },
  clock: {
    color: COLORS.white,
    fontSize: 52,
    fontFamily: FONTS.extrabold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  controlButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  mainWrap: {
    flex: 1,
  },
  mainButton: {
    backgroundColor: COLORS.secondaryGreen,
  },
  mainButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  resetButton: {
    width: 52,
    backgroundColor: COLORS.white,
  },
});
