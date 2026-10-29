import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { SPRING } from '../utils/animation';
import * as haptics from '../utils/haptics';

// Pressable que se encoge al tocarlo y vuelve con rebote (como los botones de iOS).
// `style` se aplica a la vista animada, así el aspecto del botón no cambia;
// `containerStyle` va al Pressable exterior (por ejemplo `flex: 1` dentro de una fila).
export default function PressableScale({
  children,
  style,
  onPress,
  disabled,
  scaleTo = 0.96,
  haptic = 'tap',
  accessibilityLabel,
  hitSlop,
  containerStyle,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value) => Animated.spring(scale, { toValue: value, ...SPRING }).start();

  return (
    <Pressable
      onPress={(e) => {
        if (haptic && haptics[haptic]) haptics[haptic]();
        onPress?.(e);
      }}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={hitSlop}
      style={containerStyle}
    >
      {({ pressed }) => (
        <Animated.View style={[typeof style === 'function' ? style({ pressed }) : style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
