import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// Anillo que se llena con `progress` (0-1); el contenido va centrado dentro.
// El valor animado se pasa por estado (no como prop animada) para que funcione igual en web.
export default function ProgressRing({ size = 220, stroke = 10, progress = 0, color, trackColor, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(progress)).current;
  const [shown, setShown] = useState(progress);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setShown(value));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const offset = circumference * (1 - Math.min(1, Math.max(0, shown)));

  return (
    <View style={{ width: size, height: size }}>
      {/* El giro de -90° va en el Svg para que el anillo empiece arriba (12 en punto) */}
      <Svg width={size} height={size} style={[styles.svg, { transform: [{ rotate: '-90deg' }] }]}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { position: 'absolute' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
