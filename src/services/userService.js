import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ensureSignedIn } from './authService';
import { saveUser } from '../utils/storage';

// Local primero: el perfil se guarda en AsyncStorage y luego se sincroniza a Firestore.
// Si no hay conexión, la app sigue funcionando con la copia local.
// La sincronización remota no se espera, así la UI no se bloquea por la red.
export async function saveUserProfile(user) {
  await saveUser(user);
  syncUserProfile(user);
}

async function syncUserProfile(user) {
  try {
    const { uid } = await ensureSignedIn();
    await setDoc(
      doc(db, 'users', uid),
      { name: user.name, university: user.university, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn('Perfil guardado solo localmente:', e.message);
  }
}
