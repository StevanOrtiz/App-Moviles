import {
  collection,
  doc,
  getDoc,
  getDocsFromServer,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { userRef, universityRef } from './userService';
import { getCurrentStreak, getBestStreak } from '../utils/streak';
import { getOutbox, saveOutbox } from '../utils/storage';

const sessionRef = (uid, id) => doc(db, 'users', uid, 'sessions', id);

// Orden cronológico: por fecha y luego por id (Date.now() al crearla)
export function sortSessions(sessions) {
  return [...sessions].sort((a, b) =>
    a.date === b.date ? Number(a.id) - Number(b.id) : a.date < b.date ? -1 : 1,
  );
}

// Une sesiones remotas y pendientes sin duplicar ids
export function mergeSessions(...lists) {
  const byId = new Map();
  lists.flat().forEach((s) => byId.set(s.id, s));
  return sortSessions([...byId.values()]);
}

export async function fetchRemoteSessions(uid) {
  const snapshot = await getDocsFromServer(collection(db, 'users', uid, 'sessions'));
  return sortSessions(
    snapshot.docs.map((d) => {
      const { id, date, duration, type, time } = d.data();
      return { id, date, duration, type, time };
    }),
  );
}

// Una sesión se sube en un solo batch atómico:
//   1. crea users/{uid}/sessions/{id}
//   2. suma minutos/sesiones y actualiza la racha en users/{uid}
//   3. suma minutos a universities/{universityId}
// Las reglas solo aceptan el paso 2 si el paso 1 crea una sesión nueva con esa duración,
// así que reenviar el mismo batch nunca cuenta minutos dos veces.
function commitSession(uid, profile, session, allSessions) {
  const lastDate = allSessions.reduce((max, s) => (s.date > max ? s.date : max), session.date);
  const batch = writeBatch(db);

  batch.set(sessionRef(uid, session.id), {
    id: session.id,
    date: session.date,
    duration: session.duration,
    type: session.type,
    time: session.time,
    createdAt: serverTimestamp(),
  });

  batch.update(userRef(uid), {
    totalMinutes: increment(session.duration),
    sessions: increment(1),
    currentStreak: getCurrentStreak(allSessions),
    bestStreak: Math.max(getBestStreak(allSessions), profile.bestStreak || 0),
    lastSessionDate: lastDate,
    lastSessionId: session.id,
    updatedAt: serverTimestamp(),
  });

  batch.set(
    universityRef(profile.universityId),
    {
      totalMinutes: increment(session.duration),
      students: increment(0),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return batch.commit();
}

async function removeFromOutbox(uid, id) {
  const outbox = await getOutbox(uid);
  await saveOutbox(
    uid,
    outbox.filter((s) => s.id !== id),
  );
}

export async function enqueueSession(uid, session) {
  const outbox = await getOutbox(uid);
  if (!outbox.some((s) => s.id === session.id)) {
    await saveOutbox(uid, [...outbox, session]);
  }
}

const flushing = new Set();

// Sube las sesiones pendientes una por una. Si no hay red se detiene y se
// reintenta al volver a abrir la app o al completar otra sesión.
export async function flushOutbox(uid, profile, allSessions) {
  if (flushing.has(uid) || !profile?.universityId) return;
  flushing.add(uid);
  try {
    // Se relee la cola en cada vuelta para incluir sesiones agregadas mientras se sincroniza
    const tried = new Set();
    for (;;) {
      const session = sortSessions(await getOutbox(uid)).find((s) => !tried.has(s.id));
      if (!session) break;
      tried.add(session.id);
      try {
        await commitSession(uid, profile, session, mergeSessions(allSessions, [session]));
        await removeFromOutbox(uid, session.id);
      } catch (e) {
        if (e.code !== 'permission-denied') {
          console.warn('Sincronización pendiente:', e.message);
          break;
        }
        // Rechazada por las reglas: o ya se había subido, o es inválida. En ambos casos sale de la cola.
        const existing = await getDoc(sessionRef(uid, session.id)).catch(() => null);
        if (!existing?.exists()) console.warn('Sesión descartada por inválida:', session.id);
        await removeFromOutbox(uid, session.id);
      }
    }
  } finally {
    flushing.delete(uid);
  }
}
