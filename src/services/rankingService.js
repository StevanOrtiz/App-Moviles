import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ensureSignedIn } from './authService';
import { users as mockUsers, universities as mockUniversities } from '../data/mockData';

// Lee el ranking desde Firestore; si falla o está vacío, usa los datos mock locales.
async function getTop(collectionName, fallback, max = 20) {
  try {
    await ensureSignedIn();
    const q = query(collection(db, collectionName), orderBy('totalMinutes', 'desc'), limit(max));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return fallback;
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn(`Ranking "${collectionName}" sin conexión, usando datos locales:`, e.message);
    return fallback;
  }
}

// Excluye al usuario actual: la pantalla lo agrega con sus datos locales al día.
export async function getStudentRanking() {
  const students = await getTop('users', mockUsers);
  return students.filter((s) => s.id !== auth.currentUser?.uid);
}

export function getUniversityRanking() {
  return getTop('universities', mockUniversities);
}
