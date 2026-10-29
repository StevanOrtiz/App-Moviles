import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import AnimatedNumber from './AnimatedNumber';

// Con `number` (y opcionalmente `format`) el valor se anima contando hasta el número
export default function StatCard({ label, value, accent, number, format }) {
  const valueStyle = [styles.value, accent && { color: COLORS.primary }];
  return (
    <View style={styles.card}>
      {number !== undefined ? (
        <AnimatedNumber value={number} format={format} style={valueStyle} />
      ) : (
        <Text style={valueStyle}>{value}</Text>
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
