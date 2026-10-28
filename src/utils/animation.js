import { Platform } from 'react-native';

// En web no existe el driver nativo de Animated
export const NATIVE = Platform.OS !== 'web';
