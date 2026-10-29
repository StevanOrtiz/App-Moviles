import React from 'react';
import { Text, StyleSheet } from 'react-native';
import PressableScale from './PressableScale';
import { COLORS, FONTS } from '../theme';

export default function SecondaryButton({ title, onPress, accessibilityLabel }) {
  return (
    <PressableScale
      haptic="press"
      containerStyle={styles.container}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || title}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{title}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
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
    fontFamily: FONTS.bold,
  },
});
