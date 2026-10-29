import { useContext, useEffect, useState } from 'react';
import { NavigationContext } from '@react-navigation/native';

// Como useIsFocused, pero también funciona fuera de una pantalla del navegador
// (onboarding, hojas y modales): ahí siempre devuelve true.
export default function useScreenFocus() {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(navigation ? navigation.isFocused() : true);

  useEffect(() => {
    if (!navigation) return undefined;
    setFocused(navigation.isFocused());
    const offFocus = navigation.addListener('focus', () => setFocused(true));
    const offBlur = navigation.addListener('blur', () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);

  return focused;
}
