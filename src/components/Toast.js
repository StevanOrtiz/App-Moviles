import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { usePremium } from '../context/PremiumContext';
import { NATIVE, SPRING_SOFT } from '../utils/animation';

// Aviso breve que baja desde arriba, al estilo de las notificaciones de iOS
export default function Toast() {
  const { toast, hideToast } = usePremium();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return undefined;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, ...SPRING_SOFT }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: NATIVE }).start(hideToast);
    }, 2600);
    return () => clearTimeout(timer);
  }, [toast, anim, hideToast]);

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          top: insets.top + 8,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }],
        },
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 1000,
  },
  text: { color: COLORS.white, fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
