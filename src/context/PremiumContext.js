import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { setPremium } from '../services/userService';

const PremiumContext = createContext(null);

// Límites del plan gratis (Premium los quita)
export const FREE_REMINDER_LIMIT = 3;
export const POMODORO_DURATIONS = [15, 25, 45, 50, 60]; // minutos; Premium elige, gratis = 25
export const DEFAULT_DURATION = 25;

// Estado Premium. DEMO: se activa con un botón; no hay pasarela de pagos todavía.
export function PremiumProvider({ children }) {
  const { user, profile } = useAuth();
  const [visible, setVisible] = useState(false);
  const isPremium = profile?.premium === true;

  const activate = useCallback(async () => {
    if (user) await setPremium(user.uid, true);
  }, [user]);

  const deactivate = useCallback(async () => {
    if (user) await setPremium(user.uid, false);
  }, [user]);

  const openPremium = useCallback(() => setVisible(true), []);
  const closePremium = useCallback(() => setVisible(false), []);

  const value = useMemo(
    () => ({ isPremium, activate, deactivate, visible, openPremium, closePremium }),
    [isPremium, activate, deactivate, visible, openPremium, closePremium],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  return useContext(PremiumContext);
}
