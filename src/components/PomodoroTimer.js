import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, AppState } from 'react-native';
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
      <Text style={styles.clock}>{formatClock(timer)}</Text>

      <View style={styles.controls}>
        {!isRunning ? (
          <Pressable
            style={[styles.controlButton, styles.mainButton]}
            onPress={handleStart}
            accessibilityLabel={timer === duration ? 'Iniciar' : 'Reanudar'}
          >
            <Ionicons name="play" size={22} color={COLORS.primary} />
            <Text style={styles.mainButtonText}>
              {timer === duration ? 'Iniciar' : 'Reanudar'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.controlButton, styles.mainButton]}
            onPress={handlePause}
            accessibilityLabel="Pausar"
          >
            <Ionicons name="pause" size={22} color={COLORS.primary} />
            <Text style={styles.mainButtonText}>Pausar</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.controlButton, styles.resetButton]}
          onPress={handleReset}
          accessibilityLabel="Reiniciar"
        >
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </Pressable>
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
    marginBottom: 20,
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
    flex: 1,
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
