import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// true si el usuario activó "Reducir movimiento" en el sistema
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => active && setReduced(!!value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}
