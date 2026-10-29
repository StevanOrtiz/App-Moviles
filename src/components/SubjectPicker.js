import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { COLORS, FONTS } from '../theme';
import { findSubject } from '../data/subjects';

// Atajos de materias (favoritas o recientes) como chips horizontales
export default function SubjectPicker({ ids, value, onChange, disabled }) {
  if (!ids || ids.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {ids.map((id) => {
        const s = findSubject(id);
        const active = value === id;
        return (
          <PressableScale
            key={id}
            haptic="selection"
            disabled={disabled}
            onPress={() => onChange(active ? null : id)}
            accessibilityLabel={s.name}
            style={[
              styles.chip,
              active && { backgroundColor: s.color, borderColor: s.color },
              disabled && !active && styles.chipDisabled,
            ]}
          >
            <Ionicons name={s.icon} size={14} color={active ? COLORS.white : s.color} />
            <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
              {s.name}
            </Text>
          </PressableScale>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    maxWidth: 200,
  },
  chipDisabled: { opacity: 0.45 },
  text: { fontSize: 13, fontFamily: FONTS.semibold, color: COLORS.textPrimary },
  textActive: { color: COLORS.white },
});
