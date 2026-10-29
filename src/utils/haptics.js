import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Vibración háptica. En web no hace nada y nunca lanza errores.
const enabled = Platform.OS !== 'web';

function safe(fn) {
  if (!enabled) return;
  try {
    fn().catch(() => {});
  } catch (e) {
    // dispositivo sin motor háptico
  }
}

export const tap = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const press = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const selection = () => safe(() => Haptics.selectionAsync());
export const success = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warning = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
