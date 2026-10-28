import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { findSubject } from '../data/subjects';

export default function SessionItem({ duration, time, dateLabel, subjectId }) {
  const subject = findSubject(subjectId);
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={subject.icon} size={20} color={subject.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.duration}>
          {duration} min{subjectId ? ` · ${subject.name}` : ''}
        </Text>
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
