import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function StreakCard({ streak, week }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.flame}>🔥</Text>
        <View>
          <Text style={styles.streakValue}>{streak} {streak === 1 ? 'día' : 'días'}</Text>
          <Text style={styles.streakLabel}>Racha actual</Text>
        </View>
      </View>

      <View style={styles.weekRow}>
        {week.map((day) => (
          <View key={day.label} style={styles.dayColumn}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <View style={[styles.dayDot, day.completed && styles.dayDotDone]}>
              {day.completed && <Text style={styles.dayCheck}>✓</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
