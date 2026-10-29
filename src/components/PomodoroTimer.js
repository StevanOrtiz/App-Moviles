import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Animated, Easing } from 'react-native';
import PressableScale from './PressableScale';
import { NATIVE } from '../utils/animation';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { formatClock } from '../utils/formatTime';
import { cancelPomodoroAlarm, schedulePomodoroAlarm } from '../services/notificationService';

export default function PomodoroTimer({
  timer,
  setTimer,
  isRunning,
  setIsRunning,
  onComplete,
  duration = 1500,
}) {
  const timerRef = useRef(timer);
  timerRef.current = timer;

  // Alarma: avisa cuando termina el Pomodoro aunque la app esté en segundo plano
  useEffect(() => {
    if (!isRunning) return undefined;
    schedulePomodoroAlarm(timerRef.current);
    return () => {
      cancelPomodoroAlarm();
    };
  }, [isRunning]);

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
  }, [isRunning]);

  // Latido suave del reloj mientras corre y barra de progreso
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

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: duration > 0 ? 1 - timer / duration : 0,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [timer, duration, progress]);

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

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Pomodoro</Text>
      <Animated.Text style={[styles.clock, { transform: [{ scale: clockScale }] }]}>
        {formatClock(timer)}
      </Animated.Text>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>

      <View style={styles.controls}>
        {!isRunning ? (
          <PressableScale
            haptic="press"
            containerStyle={styles.mainWrap}
            style={[styles.controlButton, styles.mainButton]}
            onPress={handleStart}
            accessibilityLabel={timer === duration ? 'Iniciar' : 'Reanudar'}
          >
            <Ionicons name="play" size={22} color={COLORS.primary} />
            <Text style={styles.mainButtonText}>
              {timer === duration ? 'Iniciar' : 'Reanudar'}
            </Text>
          </PressableScale>
        ) : (
          <PressableScale
            haptic="press"
            containerStyle={styles.mainWrap}
            style={[styles.controlButton, styles.mainButton]}
            onPress={handlePause}
            accessibilityLabel="Pausar"
          >
            <Ionicons name="pause" size={22} color={COLORS.primary} />
            <Text style={styles.mainButtonText}>Pausar</Text>
          </PressableScale>
        )}

        <PressableScale
          haptic="tap"
          style={[styles.controlButton, styles.resetButton]}
          onPress={handleReset}
          accessibilityLabel="Reiniciar"
        >
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  cardLabel: {
    color: COLORS.secondaryGreen,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  clock: {
    color: COLORS.white,
    fontSize: 52,
    fontWeight: '700',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.secondaryGreen,
  },
  mainWrap: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  controlButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  mainButton: {
    backgroundColor: COLORS.secondaryGreen,
  },
  mainButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    width: 52,
    backgroundColor: COLORS.white,
  },
});
