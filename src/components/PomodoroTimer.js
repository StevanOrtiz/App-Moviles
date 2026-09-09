import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { formatClock } from '../utils/formatTime';

const DURATION = 1500;

export default function PomodoroTimer({ timer, setTimer, isRunning, setIsRunning, onComplete }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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
    setTimer(DURATION);
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
            accessibilityLabel={timer === DURATION ? 'Iniciar' : 'Reanudar'}
          >
            <Ionicons name="play" size={22} color={COLORS.primary} />
            <Text style={styles.mainButtonText}>
              {timer === DURATION ? 'Iniciar' : 'Reanudar'}
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
