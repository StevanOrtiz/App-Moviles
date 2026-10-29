import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { COLORS, FONTS } from '../theme';
import * as haptics from '../utils/haptics';

// Fila con etiqueta y botones − / + (para minutos y ciclos)
export default function Stepper({ label, value, min, max, step = 1, format = (v) => String(v), onChange }) {
  const change = (dir) => {
    const next = Math.min(max, Math.max(min, value + dir * step));
    if (next !== value) {
      haptics.selection();
      onChange(next);
    }
  };
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <PressableScale haptic={null} onPress={() => change(-1)} style={styles.btn} accessibilityLabel={`Menos ${label}`}>
        <Text style={styles.btnText}>−</Text>
      </PressableScale>
      <Text style={styles.value}>{format(value)}</Text>
      <PressableScale haptic={null} onPress={() => change(1)} style={styles.btn} accessibilityLabel={`Más ${label}`}>
        <Text style={styles.btnText}>+</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  label: { flex: 1, fontSize: 15, fontFamily: FONTS.semibold, color: COLORS.textPrimary },
  value: { width: 64, textAlign: 'center', fontSize: 15, fontFamily: FONTS.bold, color: COLORS.primary },
  btn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.primary },
});
