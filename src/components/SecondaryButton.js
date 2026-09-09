import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function SecondaryButton({ title, onPress, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || title}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.yellow,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
