import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NATIVE } from '../utils/animation';
import useReducedMotion from '../hooks/useReducedMotion';

const SHAPES = [
  'M43.6,-58.4C55.4,-49.6,62.6,-34.6,67.1,-18.6C71.6,-2.6,73.4,14.4,67.1,28.2C60.8,42,46.4,52.6,30.8,60.1C15.2,67.6,-1.6,72,-18.4,68.9C-35.2,65.8,-52,55.2,-61.9,40.3C-71.8,25.4,-74.8,6.2,-70.6,-10.9C-66.4,-28,-55,-43,-40.9,-51.4C-26.8,-59.8,-13.4,-61.6,1.6,-63.8C16.6,-66,31.8,-67.2,43.6,-58.4Z',
  'M39.9,-51.6C51.4,-45.7,60.2,-33.7,64.4,-20.2C68.6,-6.7,68.2,8.3,62.6,20.9C57,33.5,46.2,43.7,33.6,51.7C21,59.7,6.6,65.5,-8.6,66.3C-23.8,67.1,-39.8,62.9,-50.9,52.6C-62,42.3,-68.2,25.9,-69.4,9.5C-70.6,-6.9,-66.8,-23.3,-57.4,-34.6C-48,-45.9,-33,-52.1,-19.3,-56.9C-5.6,-61.7,6.8,-65.1,18.8,-63.3C30.8,-61.5,28.4,-57.5,39.9,-51.6Z',
];

// Forma orgánica suave que gira muy despacio (decorativa, detrás del contenido)
export default function Blob({ size = 220, color, opacity = 0.2, shape = 0, style, spin = true }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!spin || reduced) return undefined;
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: NATIVE }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation, spin, reduced]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, transform: [{ rotate }] }, style]}>
      <Svg width={size} height={size} viewBox="-75 -75 150 150">
        <Path d={SHAPES[shape % SHAPES.length]} fill={color} fillOpacity={opacity} />
      </Svg>
    </Animated.View>
  );
}
