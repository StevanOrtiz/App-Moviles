import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import {
  addReminder,
  deleteReminder,
  subscribeToReminders,
  updateReminder,
} from '../services/reminderService';
import {
  cancelAllReminderNotifications,
  getPermission,
  registerForPushToken,
  requestPermission,
  syncReminderNotifications,
} from '../services/notificationService';
import { saveDeviceToken } from '../services/deviceService';
import { getCachedReminders, saveCachedReminders } from '../utils/storage';
import { getErrorCode, getErrorMessage } from '../utils/authErrors';

const RemindersContext = createContext(null);

// Recordatorios de estudio:
//   - Firestore (users/{uid}/reminders) es la fuente de verdad, en tiempo real.
//   - Cada recordatorio activo se programa como notificación local repetitiva.
//   - El token de push del dispositivo se guarda en users/{uid}/devices.
export function RemindersProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;
  const [reminders, setReminders] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState({ status: 'undetermined', canAskAgain: true });
  const [pushToken, setPushToken] = useState(null);
  const gotServerData = useRef(false);

  const refreshPermission = useCallback(async () => {
    const current = await getPermission();
    setPermission(current);
    return current;
  }, []);

  // El permiso puede cambiar desde Ajustes del sistema: se revisa al volver a la app
  useEffect(() => {
    refreshPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermission();
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  // Recordatorios en vivo desde Firestore, con copia local para abrir la app sin red
  useEffect(() => {
    if (!uid) {
      setReminders([]);
      setHydrated(false);
      setError(null);
      return undefined;
    }

    let active = true;
    gotServerData.current = false;
    setHydrated(false);

    getCachedReminders(uid).then((cached) => {
      if (active && cached && !gotServerData.current) {
        setReminders(cached);
        setHydrated(true);
      }
    });

    const unsubscribe = subscribeToReminders(
      uid,
      (list, { fromCache, hasPendingWrites }) => {
        if (!active) return;
        // Sin red y sin datos en caché no se sabe qué recordatorios existen: no se borra nada
        if (fromCache && list.length === 0 && !hasPendingWrites) return;
        gotServerData.current = true;
        setReminders(list);
        setHydrated(true);
        setError(null);
        saveCachedReminders(uid, list);
      },
      (e) => {
        console.warn('No se pudieron leer los recordatorios:', e.code, e.message);
        if (active) setError(`${getErrorMessage(e)} (${getErrorCode(e)})`);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid]);

  // Mantiene programadas las notificaciones iguales a los recordatorios guardados
  useEffect(() => {
    if (!uid || !hydrated || permission.status !== 'granted') return;
    syncReminderNotifications(reminders);
  }, [uid, hydrated, permission.status, reminders]);

  // Al cerrar sesión, este dispositivo deja de avisar los recordatorios de esa cuenta
  useEffect(() => {
    if (!authLoading && !uid) cancelAllReminderNotifications();
  }, [authLoading, uid]);

  // Token de push de este dispositivo → Firestore
  const registerDevice = useCallback(async () => {
    if (!uid) return null;
    const token = await registerForPushToken();
    if (!token) return null;
    setPushToken(token);
    await saveDeviceToken(uid, token);
    return token;
  }, [uid]);

  useEffect(() => {
    if (!uid || permission.status !== 'granted') {
      setPushToken(null);
      return;
    }
    registerDevice().catch((e) => console.warn('No se pudo guardar el token de push:', e.message));
  }, [uid, permission.status, registerDevice]);

  // Se llama desde un botón, cuando el usuario ya sabe para qué sirve el permiso
  const enableNotifications = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
    return result;
  }, []);

  const value = useMemo(
    () => ({
      reminders,
      loading: !!uid && !hydrated && !error,
      error,
      permission,
      pushToken,
      enableNotifications,
      refreshPermission,
      addReminder: (data) => addReminder(uid, data),
      updateReminder: (id, changes) => updateReminder(uid, id, changes),
      deleteReminder: (id) => deleteReminder(uid, id),
    }),
    [uid, reminders, hydrated, error, permission, pushToken, enableNotifications, refreshPermission],
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders() {
  return useContext(RemindersContext);
}
