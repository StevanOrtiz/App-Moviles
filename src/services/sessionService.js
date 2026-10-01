import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ensureSignedIn } from './authService';

// Sube una sesión Pomodoro ya guardada localmente y actualiza los acumulados del usuario.
// users/{uid}/sessions/{sessionId}
export async function syncSession(session) {
  try {
    const { uid } = await ensureSignedIn();
    await setDoc(doc(db, 'users', uid, 'sessions', session.id), {
      ...session,
      createdAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, 'users', uid),
      { totalMinutes: increment(session.duration), sessions: increment(1) },
      { merge: true }
    );
  } catch (e) {
    console.warn('Sesión guardada solo localmente:', e.message);
  }
}
