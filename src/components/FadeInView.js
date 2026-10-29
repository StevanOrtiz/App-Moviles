import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { NATIVE } from '../utils/animation';
import useReducedMotion from '../hooks/useReducedMotion';

// Aparece con fundido y un leve desplazamiento hacia arriba. Se repite al volver a la pestaña.
export default function FadeInView({ children, delay = 0, distance = 12, style, replayOnFocus = true }) {
  const anim = useRef(new Animated.Value(0)).current;
  const focused = useIsFocused();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (replayOnFocus && !focused) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: reduced ? 0 : 420,
      delay: reduced ? 0 : delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
  }, [focused, anim, delay, reduced, replayOnFocus]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
