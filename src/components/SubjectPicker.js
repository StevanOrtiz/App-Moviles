import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { NO_SUBJECT, SUBJECTS } from '../data/subjects';

// Chips horizontales para elegir materia. `allowNone` agrega la opción "Sin materia" / "Todas".
export default function SubjectPicker({
  value,
  onChange,
  disabled,
  noneLabel = NO_SUBJECT.name,
  allowNone = true,
}) {
  const options = allowNone ? [{ ...NO_SUBJECT, name: noneLabel }, ...SUBJECTS] : SUBJECTS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((s) => {
        const active = (value ?? null) === s.id;
        return (
          <Pressable
            key={s.id ?? 'none'}
            disabled={disabled}
            onPress={() => onChange(s.id)}
            accessibilityLabel={s.name}
            style={[
              styles.chip,
              active && { backgroundColor: s.color, borderColor: s.color },
              disabled && !active && styles.chipDisabled,
            ]}
          >
            <Ionicons name={s.icon} size={16} color={active ? COLORS.white : s.color} />
            <Text style={[styles.text, active && styles.textActive]}>{s.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  chipDisabled: { opacity: 0.45 },
  text: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  textActive: { color: COLORS.white },
});
