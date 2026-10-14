import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useReminders } from './RemindersContext';
import { useSessions } from './SessionsContext';
import {
  NOTIFICATIONS_SUPPORTED,
  cancelStreakReminder,
  hasPermission,
  requestPermission,
  scheduleStreakReminder,
} from '../services/notificationService';
import { getReminderPrefs, saveReminderPrefs } from '../utils/storage';

const NotificationsContext = createContext(null);

// Recordatorio de racha: un aviso a las 8:00 PM si el usuario aún no ha estudiado hoy.
// (Los recordatorios de estudio y el token de push los maneja RemindersContext.)
export function NotificationsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { refreshPermission } = useReminders();
  const { sessions } = useSessions();
  const uid = user?.uid;
  const [prefs, setPrefs] = useState({ enabled: false });
  const [denied, setDenied] = useState(false);

  // Carga la preferencia del usuario; si quitó el permiso desde Ajustes, la desactiva
  useEffect(() => {
    setDenied(false);
    if (!uid) {
      setPrefs({ enabled: false });
      return undefined;
    }
    let active = true;
    (async () => {
      const saved = await getReminderPrefs(uid);
      if (saved.enabled && !(await hasPermission())) {
        saved.enabled = false;
        await saveReminderPrefs(uid, saved);
        await cancelStreakReminder();
      }
      if (active) setPrefs(saved);
    })();
    return () => {
      active = false;
    };
  }, [uid]);

  // Al cerrar sesión se quita el aviso de racha de esa cuenta
  useEffect(() => {
    if (!authLoading && !uid) cancelStreakReminder();
  }, [authLoading, uid]);

  // Reprograma el aviso cada vez que cambian las sesiones (p. ej. al terminar un Pomodoro)
  useEffect(() => {
    if (!prefs.enabled) return;
    scheduleStreakReminder(sessions).catch((e) => console.warn('Recordatorio:', e.message));
  }, [prefs.enabled, sessions]);

  const setEnabled = useCallback(
    async (enabled) => {
      if (!uid) return false;
      setDenied(false);

      if (!enabled) {
        await cancelStreakReminder();
        const next = { enabled: false };
        await saveReminderPrefs(uid, next);
        setPrefs(next);
        return true;
      }

      const result = await requestPermission();
      await refreshPermission();
      if (result.status !== 'granted') {
        setDenied(true);
        return false;
      }
      const next = { enabled: true };
      await saveReminderPrefs(uid, next);
      setPrefs(next);
      return true;
    },
    [uid, refreshPermission],
  );

  const value = useMemo(
    () => ({
      supported: NOTIFICATIONS_SUPPORTED,
      enabled: prefs.enabled,
      denied,
      setEnabled,
    }),
    [prefs, denied, setEnabled],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
