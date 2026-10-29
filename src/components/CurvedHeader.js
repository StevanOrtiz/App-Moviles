import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import Pattern from './Pattern';
import Blob from './Blob';

// Encabezado verde con borde inferior curvo, líneas topográficas y una forma orgánica.
// `overlap` deja espacio para montar la primera tarjeta encima del borde.
export default function CurvedHeader({ children, overlap = 0, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 24 + overlap }, style]}>
      <Pattern variant="topo" opacity={0.07} />
      <Blob size={240} color={COLORS.secondaryGreen} opacity={0.12} style={styles.blob} />
      <Blob size={140} color={COLORS.yellow} opacity={0.1} shape={1} style={styles.blob2} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  blob: { top: -90, right: -70 },
  blob2: { bottom: -50, left: -40 },
});
