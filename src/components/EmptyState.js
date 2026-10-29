import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../theme';
import Blob from './Blob';
import SecondaryButton from './SecondaryButton';
import { NATIVE } from '../utils/animation';

// Pantalla sin datos: forma orgánica + emoji flotando + texto + botón opcional
export default function EmptyState({ emoji, title, text, actionLabel, onAction, compact }) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(float, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const size = compact ? 120 : 170;
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={[styles.art, { width: size, height: size }]}>
        <Blob size={size} color={COLORS.secondaryGreen} opacity={0.25} shape={0} />
        <Blob size={size * 0.7} color={COLORS.yellow} opacity={0.35} shape={1} style={styles.blob2} />
        <Animated.Text
          style={[
            styles.emoji,
            compact && { fontSize: 44 },
            { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] },
          ]}
        >
          {emoji}
        </Animated.Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!text && <Text style={styles.text}>{text}</Text>}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <SecondaryButton title={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 32 },
  compact: { paddingVertical: 16 },
  art: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  blob2: { right: -10, bottom: -6 },
  emoji: { fontFamily: FONTS.regular, fontSize: 64 },
  title: { fontFamily: FONTS.bold, fontSize: 19, color: COLORS.textPrimary, textAlign: 'center' },
  text: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 21 },
  action: { alignSelf: 'stretch', marginTop: 20 },
});
