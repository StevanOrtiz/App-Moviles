import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';

const GRAIN = require('../../assets/textures/grain.png');

// Fondo crema con grano de papel muy sutil. Envuelve el contenido de cada pantalla.
export default function Paper({ children, style }) {
  return (
    <View style={[styles.root, style]}>
      <ImageBackground
        source={GRAIN}
        resizeMode="repeat"
        style={StyleSheet.absoluteFill}
        imageStyle={styles.grain}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  grain: { opacity: 0.9 },
});
