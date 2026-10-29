import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';
import { findArea, findSubject } from '../data/subjects';

export default function SessionItem({ duration, time, dateLabel, subjectId }) {
  const subject = findSubject(subjectId);
  const area = findArea(subject.areaId);
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, subjectId && { backgroundColor: `${subject.color}1F` }]}>
        <Ionicons name={subject.icon} size={20} color={subject.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.duration} numberOfLines={1}>
          {subjectId ? subject.name : 'Sesión de estudio'}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {dateLabel ? `${dateLabel} · ` : ''}
          {time}
          {area ? ` · ${area.name}` : ''}
        </Text>
      </View>
      <Text style={styles.minutes}>{duration} min</Text>
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
  minutes: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginLeft: 8,
  },
  duration: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
