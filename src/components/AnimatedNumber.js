import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text } from 'react-native';
import useReducedMotion from '../hooks/useReducedMotion';

// Cuenta desde el valor anterior hasta `value`. `format` convierte el número en texto.
export default function AnimatedNumber({ value, format = (n) => String(n), style, duration = 700 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v)));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value || 0,
      duration: reduced ? 0 : duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, anim, duration, reduced]);

  return <Text style={style}>{format(shown)}</Text>;
}
