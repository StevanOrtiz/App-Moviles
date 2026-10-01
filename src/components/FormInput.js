import React from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function FormInput({ label, ...inputProps }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.textSecondary}
        accessibilityLabel={label}
        {...inputProps}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
});
