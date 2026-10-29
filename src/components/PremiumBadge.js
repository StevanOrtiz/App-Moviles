import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { NATIVE } from '../utils/animation';

// Corona con un leve balanceo y brillo, para el nombre de los usuarios Premium
export default function PremiumBadge({ size = 18 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(anim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.delay(1800),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.Text
      style={{
        fontSize: size,
        transform: [
          { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '10deg'] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) },
        ],
      }}
    >
      👑
    </Animated.Text>
  );
}
