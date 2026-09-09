import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

export default function SessionItem({ duration, time, dateLabel }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name="time-outline" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.duration}>{duration} min</Text>
        <Text style={styles.time}>
          {dateLabel ? `${dateLabel} · ` : ''}
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  duration: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
