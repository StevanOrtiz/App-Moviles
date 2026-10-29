import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS } from '../theme';
import { NATIVE, SPRING_SOFT } from '../utils/animation';

const HEIGHT = Dimensions.get('window').height;

// Hoja inferior estilo iOS: el fondo se oscurece, la tarjeta sube con resorte y se cierra
// tocando fuera o arrastrándola hacia abajo desde el borde superior. `height` (0-1) fija su alto.
// `overlay` se dibuja encima (por ejemplo, confeti).
export default function Sheet({ visible, onClose, children, dismissable = true, overlay, height }) {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    if (visible) {
      closing.current = false;
      setMounted(true);
      drag.setValue(0);
      Animated.spring(progress, { toValue: 1, ...SPRING_SOFT }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: NATIVE,
      }).start(() => setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    if (!dismissable || closing.current) return;
    closing.current = true;
    onClose?.();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 1.2) close();
        else Animated.spring(drag, { toValue: 0, ...SPRING_SOFT }).start();
      },
    }),
  ).current;

  if (!mounted) return null;

  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [HEIGHT * 0.6, 0] }),
    drag,
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Cerrar" />
        </Animated.View>
        <Animated.View
          style={[styles.card, height && { height: HEIGHT * height }, { transform: [{ translateY }] }]}
        >
          {/* Solo la parte de arriba arrastra: así las listas dentro de la hoja pueden hacer scroll */}
          <View style={styles.handle} {...pan.panHandlers}>
            <View style={styles.grabber} />
          </View>
          {children}
        </Animated.View>
        {overlay}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18, 58, 54, 0.5)' },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 36,
  },
  handle: {
    paddingTop: 2,
    paddingBottom: 18,
    marginHorizontal: -24,
    alignItems: 'center',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E0D6',
  },
});
