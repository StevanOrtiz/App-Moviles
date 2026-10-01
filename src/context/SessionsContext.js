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
  enqueueSession,
  fetchRemoteSessions,
  flushOutbox,
  mergeSessions,
} from '../services/sessionService';
import {
  clearLegacyData,
  getCachedSessions,
  getLegacyData,
  getOutbox,
  saveCachedSessions,
} from '../utils/storage';

const SessionsContext = createContext(null);

// Las sesiones de la versión sin cuenta se suben a la cuenta del primer usuario que inicia sesión
async function migrateLegacySessions(uid) {
  const { sessions } = await getLegacyData();
  const valid = sessions.filter(
    (s) => s && s.id && s.date && s.duration > 0 && s.duration <= 60 && s.type === 'pomodoro',
  );
  for (const session of valid) {
    await enqueueSession(uid, session);
  }
  await clearLegacyData();
}

export function SessionsProvider({ children }) {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const hasProfile = !!profile?.universityId;
  const [sessions, setSessions] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Refs para que addSession sea estable (el Pomodoro guarda el callback al iniciar)
  const sessionsRef = useRef(sessions);
  const profileRef = useRef(profile);
  sessionsRef.current = sessions;
  profileRef.current = profile;

  const updateSessions = useCallback(
    (next) => {
      sessionsRef.current = next;
      setSessions(next);
      if (uid) saveCachedSessions(uid, next);
    },
    [uid],
  );

  const sync = useCallback(async () => {
    if (!uid || !profileRef.current) return;
    setSyncing(true);
    try {
      await flushOutbox(uid, profileRef.current, sessionsRef.current);
      const [remote, pending] = await Promise.all([fetchRemoteSessions(uid), getOutbox(uid)]);
      updateSessions(mergeSessions(remote, pending));
    } catch (e) {
      console.warn('Sin conexión, usando sesiones guardadas:', e.message);
    } finally {
      setSyncing(false);
    }
  }, [uid, updateSessions]);

  // Al iniciar sesión: caché local inmediata, luego migración y sincronización
  useEffect(() => {
    if (!uid) {
      setSessions([]);
      return;
    }
    let active = true;
    (async () => {
      const [cached, pending] = await Promise.all([getCachedSessions(uid), getOutbox(uid)]);
      // Se une con lo que ya haya llegado del servidor para no pisarlo con la caché
      if (active) updateSessions(mergeSessions(cached, pending, sessionsRef.current));
    })();
    return () => {
      active = false;
    };
  }, [uid, updateSessions]);

  useEffect(() => {
    if (!uid || !hasProfile) return;
    (async () => {
      await migrateLegacySessions(uid);
      const pending = await getOutbox(uid);
      updateSessions(mergeSessions(sessionsRef.current, pending));
      await sync();
    })();
  }, [uid, hasProfile, sync, updateSessions]);

  // Reintenta al volver a la app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, [sync]);

  const addSession = useCallback(
    async (session) => {
      if (!uid) return;
      const next = mergeSessions(sessionsRef.current, [session]);
      updateSessions(next);
      await enqueueSession(uid, session);
      if (profileRef.current) flushOutbox(uid, profileRef.current, next);
    },
    [uid, updateSessions],
  );

  const value = useMemo(
    () => ({ sessions, syncing, addSession, refresh: sync }),
    [sessions, syncing, addSession, sync],
  );

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}

export function useSessions() {
  return useContext(SessionsContext);
}
