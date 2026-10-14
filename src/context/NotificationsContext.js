import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSessions } from './SessionsContext';
import {
  cancelReminders,
  configureNotifications,
  hasPermission,
  notificationsSupported,
  registerPushToken,
  requestPermission,
  scheduleStreakReminder,
  unregisterPushToken,
} from '../services/notificationService';
import { getReminderPrefs, saveReminderPrefs } from '../utils/storage';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { sessions } = useSessions();
  const uid = user?.uid;
  const [prefs, setPrefs] = useState({ enabled: false, pushToken: null });
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    configureNotifications().catch((e) => console.warn('Notificaciones:', e.message));
  }, []);

  // Carga la preferencia del usuario; si quitó el permiso desde Ajustes, la desactiva
  useEffect(() => {
    setDenied(false);
    if (!uid) {
      setPrefs({ enabled: false, pushToken: null });
      return;
    }
    let active = true;
    (async () => {
      const saved = await getReminderPrefs(uid);
      if (saved.enabled && !(await hasPermission())) {
        saved.enabled = false;
        await saveReminderPrefs(uid, saved);
        await cancelReminders();
      }
      if (active) setPrefs(saved);
    })();
    return () => {
      active = false;
    };
  }, [uid]);

  // Reprograma el recordatorio cada vez que cambian las sesiones (p. ej. al terminar un Pomodoro)
  useEffect(() => {
    if (!prefs.enabled) return;
    scheduleStreakReminder(sessions).catch((e) => console.warn('Recordatorio:', e.message));
  }, [prefs.enabled, sessions]);

  const setEnabled = useCallback(
    async (enabled) => {
      if (!uid) return false;
      setDenied(false);

      if (!enabled) {
        await cancelReminders();
        await unregisterPushToken(uid, prefs.pushToken);
        const next = { enabled: false, pushToken: null };
        await saveReminderPrefs(uid, next);
        setPrefs(next);
        return true;
      }

      if (!(await requestPermission())) {
        setDenied(true);
        return false;
      }
      const pushToken = await registerPushToken(uid);
      const next = { enabled: true, pushToken };
      await saveReminderPrefs(uid, next);
      setPrefs(next);
      return true;
    },
    [uid, prefs.pushToken],
  );

  const value = useMemo(
    () => ({
      supported: notificationsSupported,
      enabled: prefs.enabled,
      pushRegistered: !!prefs.pushToken,
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
