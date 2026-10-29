import { Platform } from 'react-native';

// En web no existe el driver nativo de Animated
export const NATIVE = Platform.OS !== 'web';

// Resortes con la sensación de UIKit: rápido y con un rebote leve
export const SPRING = { tension: 300, friction: 20, useNativeDriver: NATIVE };
export const SPRING_SOFT = { tension: 140, friction: 14, useNativeDriver: NATIVE };
