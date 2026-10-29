import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { setGoals as saveGoals, setPremium } from '../services/userService';
import { getPromoState, savePromoState } from '../utils/storage';
import {
  emptyPromoState,
  markSeen,
  pickPromo,
  recordAccept,
  recordDismiss,
  recordShown,
} from '../utils/promo';
import * as haptics from '../utils/haptics';

const PremiumContext = createContext(null);

// Límites del plan gratis (Premium los quita)
export const FREE_REMINDER_LIMIT = 3;
export const POMODORO_DURATIONS = [15, 25, 45, 50, 60]; // minutos; Premium elige, gratis = 25
export const DEFAULT_DURATION = 25;

const PROMO_DELAY = 900; // ms: deja terminar la animación de lo que el usuario acaba de hacer

// Estado Premium, promociones y avisos breves (toast).
// DEMO: Premium se activa con un botón; no hay pasarela de pagos todavía.
export function PremiumProvider({ children }) {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const isPremium = profile?.premium === true;

  const [visible, setVisible] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [promo, setPromo] = useState(null);
  const [toast, setToast] = useState(null);
  const promoState = useRef(emptyPromoState());
  const promoTimer = useRef(null);
  const visibleRef = useRef(false);
  visibleRef.current = visible;

  // Carga el estado de promos y registra el primer uso del dispositivo
  useEffect(() => {
    if (!uid) return;
    getPromoState(uid).then((saved) => {
      promoState.current = markSeen(saved || {});
      savePromoState(uid, promoState.current);
    });
    return () => clearTimeout(promoTimer.current);
  }, [uid]);

  const updatePromoState = useCallback(
    (next) => {
      promoState.current = next;
      if (uid) savePromoState(uid, next);
    },
    [uid],
  );

  // events: evento o lista por prioridad. ctx: { sessionsCount, streak, subjectName, isRunning }
  const notifyPromo = useCallback(
    (events, ctx = {}) => {
      if (!uid || isPremium || visibleRef.current) return;
      const fullCtx = { ...ctx, isPremium };
      const next = pickPromo(promoState.current, events, fullCtx);
      if (!next) return;
      updatePromoState(recordShown(promoState.current, next, fullCtx));
      clearTimeout(promoTimer.current);
      promoTimer.current = setTimeout(() => {
        if (!visibleRef.current) setPromo(next);
      }, PROMO_DELAY);
    },
    [uid, isPremium, updatePromoState],
  );

  const openPremium = useCallback(() => {
    setPromo(null);
    setVisible(true);
  }, []);
  const closePremium = useCallback(() => {
    setVisible(false);
    setWelcome(false);
  }, []);

  const dismissPromo = useCallback(() => {
    setPromo(null);
    updatePromoState(recordDismiss(promoState.current));
  }, [updatePromoState]);

  const acceptPromo = useCallback(() => {
    updatePromoState(recordAccept(promoState.current));
    openPremium();
  }, [updatePromoState, openPremium]);

  const activate = useCallback(async () => {
    if (!uid) return;
    await setPremium(uid, true);
    haptics.success();
    setWelcome(true);
  }, [uid]);

  const deactivate = useCallback(async () => {
    if (uid) await setPremium(uid, false);
  }, [uid]);

  const setGoals = useCallback(
    async (goals) => {
      if (uid) await saveGoals(uid, goals);
    },
    [uid],
  );

  const showToast = useCallback((message) => {
    setToast({ message, key: Date.now() });
  }, []);
  const hideToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({
      isPremium,
      premiumSince: profile?.premiumSince || null,
      goals: profile?.goals || {},
      activate,
      deactivate,
      setGoals,
      visible,
      welcome,
      openPremium,
      closePremium,
      promo,
      notifyPromo,
      dismissPromo,
      acceptPromo,
      toast,
      showToast,
      hideToast,
    }),
    [
      isPremium,
      profile?.premiumSince,
      profile?.goals,
      activate,
      deactivate,
      setGoals,
      visible,
      welcome,
      openPremium,
      closePremium,
      promo,
      notifyPromo,
      dismissPromo,
      acceptPromo,
      toast,
      showToast,
      hideToast,
    ],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  return useContext(PremiumContext);
}
