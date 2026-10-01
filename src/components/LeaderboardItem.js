import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import { formatMinutes } from '../utils/formatTime';

const MEDALS = { 1: '🏆', 2: '🥈', 3: '🥉' };

export default function LeaderboardItem({
  position,
  name,
  subtitle,
  totalMinutes,
  streak,
  isCurrentUser,
}) {
  const isTop = position <= 3;

  return (
    <View style={[styles.row, isCurrentUser && styles.currentUserRow, isTop && styles.topRow]}>
      <View style={styles.positionWrap}>
        {MEDALS[position] ? (
          <Text style={styles.medal}>{MEDALS[position]}</Text>
        ) : (
          <Text style={styles.position}>{position}</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
          {isCurrentUser ? ' (Tú)' : ''}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.metrics}>
        <Text style={styles.minutes}>{formatMinutes(totalMinutes)}</Text>
        {streak !== undefined && (
          <Text style={styles.streak}>
            🔥 {streak} {streak === 1 ? 'día' : 'días'}
          </Text>
        )}
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
  topRow: {
    borderWidth: 1.5,
    borderColor: COLORS.secondaryGreen,
  },
  currentUserRow: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  positionWrap: {
    width: 40,
    alignItems: 'center',
  },
  medal: {
    fontSize: 24,
  },
  position: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  info: {
    flex: 1,
    marginLeft: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metrics: {
    alignItems: 'flex-end',
  },
  minutes: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  streak: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
