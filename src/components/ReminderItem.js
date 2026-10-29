import React from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';
import { describeDays, formatReminderTime } from '../utils/reminders';

export default function ReminderItem({ reminder, onToggle, onEdit, onDelete }) {
  const { title, hour, minute, days, enabled } = reminder;
  return (
    <Pressable
      style={[styles.card, !enabled && styles.cardOff]}
      onPress={onEdit}
      accessibilityLabel={`Editar recordatorio ${title}`}
    >
      <View style={styles.info}>
        <Text style={[styles.time, !enabled && styles.textOff]}>
          {formatReminderTime(hour, minute)}
        </Text>
        <Text style={[styles.title, !enabled && styles.textOff]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.days}>{describeDays(days)}</Text>
      </View>

      <View style={styles.actions}>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#D9DCD8', true: COLORS.secondaryGreen }}
          thumbColor={COLORS.white}
          accessibilityLabel={`Activar recordatorio ${title}`}
        />
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          accessibilityLabel={`Eliminar recordatorio ${title}`}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  cardOff: {
    opacity: 0.75,
  },
  info: {
    flex: 1,
  },
  time: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  days: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  textOff: {
    color: COLORS.textSecondary,
  },
  actions: {
    alignItems: 'center',
    gap: 12,
    marginLeft: 12,
  },
});
