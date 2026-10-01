import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';

// Devuelve el usuario autenticado; si no hay sesión, inicia una anónima.
// Requiere habilitar "Anónimo" en Firebase Console > Authentication.
export async function ensureSignedIn() {
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
