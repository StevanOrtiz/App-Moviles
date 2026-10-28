import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import { NATIVE } from '../utils/animation';

const PIECES = ['🎉', '✨', '👑', '⭐', '💛', '🎊'];
const COUNT = 26;

// Lluvia de confeti de una sola vez; se monta cuando hay que celebrar
export default function Confetti() {
  const { width, height } = Dimensions.get('window');
  const pieces = useRef(
    Array.from({ length: COUNT }, (_, i) => ({
      emoji: PIECES[i % PIECES.length],
      left: Math.random() * (width - 30),
      delay: Math.random() * 600,
      duration: 1800 + Math.random() * 1400,
      size: 18 + Math.random() * 16,
      anim: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    const animations = pieces.map((p) =>
      Animated.timing(p.anim, {
        toValue: 1,
        delay: p.delay,
        duration: p.duration,
        useNativeDriver: NATIVE,
      }),
    );
    Animated.parallel(animations).start();
  }, [pieces]);

  return (
    <>
      {pieces.map((p, i) => (
        <Animated.Text
          key={i}
          pointerEvents="none"
          style={[
            styles.piece,
            {
              left: p.left,
              fontSize: p.size,
              opacity: p.anim.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [-40, height] }) },
                { rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }) },
              ],
            },
          ]}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0 },
});
